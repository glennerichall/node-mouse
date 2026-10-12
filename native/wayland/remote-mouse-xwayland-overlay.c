#define _POSIX_C_SOURCE 200809L

#include <X11/Xlib.h>
#include <X11/Xutil.h>
#include <errno.h>
#include <poll.h>
#include <png.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

/*
 * QR overlay helper for X11 and XWayland.
 *
 * Node owns QR generation and process supervision. This process owns only the
 * native window and PNG conversion. QR visibility changes only in response to
 * explicit lifecycle commands; the helper does not observe pointer motion.
 */
typedef struct {
    Display *display;
    Window window;
    GC gc;
    XImage *image;
    int x;
    int y;
    unsigned int size;
    bool requested_visible;
} Overlay;

static void emit_state(const char *state) {
    printf("STATE %s\n", state);
    fflush(stdout);
}

static unsigned long channel_to_mask(unsigned char channel, unsigned long mask) {
    /* Convert an 8-bit PNG channel to the server visual's actual bit mask. */
    if (mask == 0) return 0;
    unsigned int shift = 0;
    while (((mask >> shift) & 1UL) == 0UL) shift++;
    unsigned long maximum = mask >> shift;
    return (((unsigned long)channel * maximum + 127UL) / 255UL) << shift;
}

static void destroy_image(Overlay *overlay) {
    if (overlay->image != NULL) {
        XDestroyImage(overlay->image);
        overlay->image = NULL;
    }
}

static bool load_png(Overlay *overlay, const char *path) {
    /* libpng's simplified API decodes to RGBA. XImage pixels are rebuilt for
     * the active X visual and nearest-neighbour scaled to the configured size,
     * preserving the hard edges required for a scannable QR code. */
    png_image png = {0};
    png.version = PNG_IMAGE_VERSION;
    if (!png_image_begin_read_from_file(&png, path)) {
        fprintf(stderr, "Cannot read QR PNG: %s\n", png.message);
        return false;
    }
    png.format = PNG_FORMAT_RGBA;
    unsigned char *rgba = malloc(PNG_IMAGE_SIZE(png));
    if (rgba == NULL || !png_image_finish_read(&png, NULL, rgba, 0, NULL)) {
        fprintf(stderr, "Cannot decode QR PNG: %s\n", png.message);
        free(rgba);
        png_image_free(&png);
        return false;
    }

    Screen *screen = DefaultScreenOfDisplay(overlay->display);
    Visual *visual = DefaultVisualOfScreen(screen);
    int depth = DefaultDepthOfScreen(screen);
    size_t bytes = (size_t)overlay->size * overlay->size * 4U;
    char *pixels = calloc(1, bytes);
    XImage *image = XCreateImage(overlay->display, visual, (unsigned int)depth,
        ZPixmap, 0, pixels, overlay->size, overlay->size, 32, 0);
    if (pixels == NULL || image == NULL) {
        free(pixels);
        free(rgba);
        png_image_free(&png);
        return false;
    }

    for (unsigned int y = 0; y < overlay->size; y++) {
        unsigned int source_y = (unsigned int)(((unsigned long long)y * png.height) / overlay->size);
        for (unsigned int x = 0; x < overlay->size; x++) {
            unsigned int source_x = (unsigned int)(((unsigned long long)x * png.width) / overlay->size);
            const unsigned char *source = rgba + (((size_t)source_y * png.width + source_x) * 4U);
            unsigned long pixel = channel_to_mask(source[0], visual->red_mask)
                | channel_to_mask(source[1], visual->green_mask)
                | channel_to_mask(source[2], visual->blue_mask);
            XPutPixel(image, (int)x, (int)y, pixel);
        }
    }

    free(rgba);
    png_image_free(&png);
    destroy_image(overlay);
    overlay->image = image;
    return true;
}

static void draw_overlay(Overlay *overlay) {
    if (overlay->image != NULL && overlay->requested_visible) {
        XPutImage(overlay->display, overlay->window, overlay->gc, overlay->image,
            0, 0, 0, 0, overlay->size, overlay->size);
    }
}

static void show_overlay(Overlay *overlay) {
    overlay->requested_visible = true;
    XMapRaised(overlay->display, overlay->window);
    draw_overlay(overlay);
    XSync(overlay->display, False);
    emit_state("visible");
}

static void hide_overlay(Overlay *overlay) {
    overlay->requested_visible = false;
    XUnmapWindow(overlay->display, overlay->window);
    XFlush(overlay->display);
    emit_state("hidden");
}

static bool update_overlay(Overlay *overlay, const char *path, int x, int y,
        unsigned int size) {
    /* UPDATE is atomic from the caller's perspective: geometry and image are
     * replaced while unmapped, then prior visibility intent is restored. */
    bool was_visible = overlay->requested_visible;
    XUnmapWindow(overlay->display, overlay->window);
    overlay->x = x;
    overlay->y = y;
    overlay->size = size;
    XMoveResizeWindow(overlay->display, overlay->window, x, y, size, size);
    if (!load_png(overlay, path)) return false;
    if (was_visible) show_overlay(overlay);
    return true;
}

static bool handle_command(Overlay *overlay, char *line) {
    /* IPC grammar: request-id SHOW|HIDE|CLOSE|UPDATE args. Every command is
     * acknowledged only after its X11 operation has been flushed. */
    char *command = line;
    char *id_end = NULL;
    errno = 0;
    unsigned long request_id = strtoul(line, &id_end, 10);
    if (errno != 0 || id_end == line || *id_end != ' ') return true;
    command = id_end + 1;
    const char *ack_state = "error";
    bool keep_running = true;
    if (strncmp(command, "SHOW", 4) == 0) {
        show_overlay(overlay);
        ack_state = "visible";
    } else if (strncmp(command, "HIDE", 4) == 0) {
        hide_overlay(overlay);
        ack_state = "hidden";
    } else if (strncmp(command, "CLOSE", 5) == 0) {
        ack_state = "closed";
        keep_running = false;
    } else if (strncmp(command, "UPDATE ", 7) == 0) {
        char path[4096];
        int x, y;
        unsigned int size;
        if (sscanf(command + 7, "%4095s %d %d %u", path, &x, &y, &size) == 4 && size > 0) {
            if (update_overlay(overlay, path, x, y, size)) {
                ack_state = "updated";
            }
        }
    }
    printf("ACK %lu %s\n", request_id, ack_state);
    fflush(stdout);
    return keep_running;
}

int main(int argc, char **argv) {
    if (argc != 5) {
        fprintf(stderr, "Usage: %s PNG X Y SIZE\n", argv[0]);
        return EXIT_FAILURE;
    }
    Overlay overlay = {0};
    /* getline() is used only after poll() reports stdin readable. Keep stdio
     * from reading ahead: if it buffers two commands at once, poll() may no
     * longer see the second command in the kernel pipe and the helper can
     * strand a rapid HIDE/SHOW (or UPDATE/SHOW) sequence indefinitely. */
    setvbuf(stdin, NULL, _IONBF, 0);
    overlay.x = atoi(argv[2]);
    overlay.y = atoi(argv[3]);
    overlay.size = (unsigned int)strtoul(argv[4], NULL, 10);
    if (overlay.size == 0) return EXIT_FAILURE;

    overlay.display = XOpenDisplay(NULL);
    if (overlay.display == NULL) {
        fprintf(stderr, "Cannot open X11/XWayland display\n");
        return EXIT_FAILURE;
    }
    int screen = DefaultScreen(overlay.display);
    XSetWindowAttributes attributes = {0};
    /* override_redirect keeps the utility window out of window-manager layout,
     * decoration and focus handling. */
    attributes.override_redirect = True;
    attributes.event_mask = ExposureMask | StructureNotifyMask;
    overlay.window = XCreateWindow(overlay.display, RootWindow(overlay.display, screen),
        overlay.x, overlay.y, overlay.size, overlay.size, 0, CopyFromParent, InputOutput,
        CopyFromParent, CWOverrideRedirect | CWEventMask, &attributes);
    overlay.gc = XCreateGC(overlay.display, overlay.window, 0, NULL);
    XStoreName(overlay.display, overlay.window, "Remote Mouse QR Overlay");
    if (!load_png(&overlay, argv[1])) {
        XDestroyWindow(overlay.display, overlay.window);
        XCloseDisplay(overlay.display);
        return EXIT_FAILURE;
    }
    show_overlay(&overlay);
    emit_state("ready");

    char *line = NULL;
    size_t line_size = 0;
    bool running = true;
    while (running) {
        /* Drain X events before blocking so redraws are handled even when no
         * IPC command is pending. */
        while (XPending(overlay.display)) {
            XEvent event;
            XNextEvent(overlay.display, &event);
            if (event.type == Expose) draw_overlay(&overlay);
        }

        struct pollfd fds[2] = {
            {.fd = STDIN_FILENO, .events = POLLIN},
            {.fd = ConnectionNumber(overlay.display), .events = POLLIN},
        };
        int result = poll(fds, 2, -1);
        if (result < 0 && errno != EINTR) break;
        if (fds[0].revents & (POLLHUP | POLLERR)) break;
        if (fds[0].revents & POLLIN) {
            ssize_t length = getline(&line, &line_size, stdin);
            if (length < 0 || !handle_command(&overlay, line)) running = false;
        }
    }

    free(line);
    destroy_image(&overlay);
    XFreeGC(overlay.display, overlay.gc);
    XDestroyWindow(overlay.display, overlay.window);
    XCloseDisplay(overlay.display);
    return EXIT_SUCCESS;
}
