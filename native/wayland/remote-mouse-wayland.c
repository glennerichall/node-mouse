#define _POSIX_C_SOURCE 200809L

#include <errno.h>
#include <linux/input-event-codes.h>
#include <poll.h>
#include <signal.h>
#include <stdbool.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include <libei.h>
#include <liboeffis.h>

static volatile sig_atomic_t running = 1;
static struct oeffis *portal = NULL;
static struct ei *ei = NULL;
static struct ei_device *pointer_device = NULL;
static struct ei_device *keyboard_device = NULL;
static uint32_t emulation_sequence = 1;

static void emit_status(const char *status, const char *detail) {
    printf("{\"type\":\"status\",\"status\":\"%s\"", status);
    if (detail && detail[0] != '\0') {
        printf(",\"detail\":\"");
        for (const char *cursor = detail; *cursor; cursor++) {
            if (*cursor == '\\' || *cursor == '\"') {
                putchar('\\');
            }
            if (*cursor == '\n' || *cursor == '\r') {
                putchar(' ');
            } else {
                putchar(*cursor);
            }
        }
        putchar('\"');
    }
    puts("}");
    fflush(stdout);
}

static void handle_signal(int signal_number) {
    (void)signal_number;
    running = 0;
}

static void replace_device(struct ei_device **target, struct ei_device *device) {
    if (*target == device) {
        return;
    }
    if (*target) {
        *target = ei_device_unref(*target);
    }
    *target = ei_device_ref(device);
}

static void remove_device(struct ei_device *device) {
    if (pointer_device == device) {
        pointer_device = ei_device_unref(pointer_device);
    }
    if (keyboard_device == device) {
        keyboard_device = ei_device_unref(keyboard_device);
    }
}

static void dispatch_ei(void) {
    ei_dispatch(ei);
    struct ei_event *event;
    while ((event = ei_get_event(ei)) != NULL) {
        const enum ei_event_type type = ei_event_get_type(event);
        struct ei_device *device = ei_event_get_device(event);

        switch (type) {
            case EI_EVENT_SEAT_ADDED: {
                struct ei_seat *seat = ei_event_get_seat(event);
                ei_seat_bind_capabilities(
                    seat,
                    EI_DEVICE_CAP_POINTER,
                    EI_DEVICE_CAP_BUTTON,
                    EI_DEVICE_CAP_SCROLL,
                    EI_DEVICE_CAP_KEYBOARD,
                    NULL
                );
                break;
            }
            case EI_EVENT_DEVICE_RESUMED:
                {
                bool selected = false;
                if (ei_device_has_capability(device, EI_DEVICE_CAP_POINTER)) {
                    replace_device(&pointer_device, device);
                    selected = true;
                }
                if (ei_device_has_capability(device, EI_DEVICE_CAP_KEYBOARD)) {
                    replace_device(&keyboard_device, device);
                    selected = true;
                }
                if (selected) {
                    ei_device_start_emulating(device, emulation_sequence++);
                }
                if (pointer_device || keyboard_device) {
                    emit_status("ready", NULL);
                }
                break;
                }
            case EI_EVENT_DEVICE_PAUSED:
                emit_status("permission-required", "EIS device unavailable");
                break;
            case EI_EVENT_DEVICE_REMOVED:
                remove_device(device);
                emit_status("permission-required", "EIS device removed");
                break;
            case EI_EVENT_DISCONNECT:
                emit_status("revoked", "EIS disconnected");
                running = 0;
                break;
            default:
                break;
        }

        ei_event_unref(event);
    }
}

static bool setup_ei(void) {
    int fd = oeffis_get_eis_fd(portal);
    if (fd < 0) {
        emit_status("portal-error", strerror(errno));
        return false;
    }

    ei = ei_new_sender(NULL);
    if (!ei) {
        close(fd);
        emit_status("portal-error", "Unable to create libei sender");
        return false;
    }
    ei_configure_name(ei, "remote-mouse");
    if (ei_setup_backend_fd(ei, fd) != 0) {
        close(fd);
        emit_status("portal-error", "Unable to connect libei to EIS");
        return false;
    }
    return true;
}

static void dispatch_portal(void) {
    oeffis_dispatch(portal);
    enum oeffis_event_type event;
    while ((event = oeffis_get_event(portal)) != OEFFIS_EVENT_NONE) {
        switch (event) {
            case OEFFIS_EVENT_CONNECTED_TO_EIS:
                if (!setup_ei()) {
                    running = 0;
                }
                break;
            case OEFFIS_EVENT_CLOSED:
                emit_status("denied", "RemoteDesktop session closed");
                running = 0;
                break;
            case OEFFIS_EVENT_DISCONNECTED:
                emit_status("portal-error", oeffis_get_error_message(portal));
                running = 0;
                break;
            default:
                break;
        }
    }
}

static void frame(struct ei_device *device) {
    ei_device_frame(device, ei_now(ei));
}

static void handle_command(char *line) {
    double x, y;
    unsigned int code, pressed;

    if (sscanf(line, "MOVE %lf %lf", &x, &y) == 2) {
        if (pointer_device) {
            ei_device_pointer_motion(pointer_device, x, y);
            frame(pointer_device);
        }
        return;
    }
    if (sscanf(line, "BUTTON %u %u", &code, &pressed) == 2) {
        if (pointer_device && ei_device_has_capability(pointer_device, EI_DEVICE_CAP_BUTTON)) {
            ei_device_button_button(pointer_device, code, pressed != 0);
            frame(pointer_device);
        }
        return;
    }
    if (sscanf(line, "SCROLL %lf %lf", &x, &y) == 2) {
        if (pointer_device && ei_device_has_capability(pointer_device, EI_DEVICE_CAP_SCROLL)) {
            ei_device_scroll_delta(pointer_device, x, y);
            frame(pointer_device);
        }
        return;
    }
    if (sscanf(line, "KEY %u %u", &code, &pressed) == 2) {
        if (keyboard_device) {
            ei_device_keyboard_key(keyboard_device, code, pressed != 0);
            frame(keyboard_device);
        }
        return;
    }
    if (strncmp(line, "PING", 4) == 0) {
        emit_status(pointer_device || keyboard_device ? "ready" : "permission-required", NULL);
        return;
    }
    if (strncmp(line, "STOP", 4) == 0) {
        running = 0;
    }
}

static void cleanup(void) {
    struct ei_device *shared_device = pointer_device && pointer_device == keyboard_device
        ? pointer_device
        : NULL;
    if (pointer_device) {
        ei_device_stop_emulating(pointer_device);
        pointer_device = ei_device_unref(pointer_device);
    }
    if (keyboard_device) {
        if (!shared_device) {
            ei_device_stop_emulating(keyboard_device);
        }
        keyboard_device = ei_device_unref(keyboard_device);
    }
    if (ei) {
        ei_disconnect(ei);
        ei = ei_unref(ei);
    }
    if (portal) {
        portal = oeffis_unref(portal);
    }
}

int main(void) {
    signal(SIGINT, handle_signal);
    signal(SIGTERM, handle_signal);

    portal = oeffis_new(NULL);
    if (!portal) {
        emit_status("portal-missing", "Unable to initialize liboeffis");
        return EXIT_FAILURE;
    }

    emit_status("permission-required", NULL);
    oeffis_create_session(portal, OEFFIS_DEVICE_POINTER | OEFFIS_DEVICE_KEYBOARD);

    char *line = NULL;
    size_t line_capacity = 0;
    while (running) {
        struct pollfd fds[3] = {
            {.fd = STDIN_FILENO, .events = POLLIN},
            {.fd = oeffis_get_fd(portal), .events = POLLIN},
            {.fd = ei ? ei_get_fd(ei) : -1, .events = POLLIN},
        };
        const int result = poll(fds, 3, -1);
        if (result < 0) {
            if (errno == EINTR) {
                continue;
            }
            emit_status("portal-error", strerror(errno));
            break;
        }
        if (fds[0].revents & (POLLIN | POLLHUP)) {
            if (getline(&line, &line_capacity, stdin) < 0) {
                break;
            }
            handle_command(line);
        }
        if (fds[1].revents & POLLIN) {
            dispatch_portal();
        }
        if (ei && fds[2].revents & POLLIN) {
            dispatch_ei();
        }
    }

    free(line);
    cleanup();
    return EXIT_SUCCESS;
}
