#define _POSIX_C_SOURCE 200809L

#include <errno.h>
#include <fcntl.h>
#include <linux/input-event-codes.h>
#include <linux/uinput.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/ioctl.h>
#include <unistd.h>

static int device_fd = -1;
static double pointer_remainder_x = 0;
static double pointer_remainder_y = 0;
static double scroll_remainder_x = 0;
static double scroll_remainder_y = 0;

static void emit_status(const char *status, const char *detail) {
    printf("{\"type\":\"status\",\"status\":\"%s\"", status);
    if (detail != NULL) {
        printf(",\"detail\":\"");
        for (const char *cursor = detail; *cursor != '\0'; cursor++) {
            if (*cursor == '\"' || *cursor == '\\') {
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

static bool emit_event(unsigned short type, unsigned short code, int value) {
    struct input_event event = {0};
    event.type = type;
    event.code = code;
    event.value = value;
    return write(device_fd, &event, sizeof(event)) == (ssize_t)sizeof(event);
}

static bool sync_events(void) {
    return emit_event(EV_SYN, SYN_REPORT, 0);
}

static int enable_keys(int fd) {
    for (int code = 0; code <= KEY_MAX; code++) {
        if (ioctl(fd, UI_SET_KEYBIT, code) < 0) {
            return -1;
        }
    }
    return 0;
}

static int create_device(void) {
    device_fd = open("/dev/uinput", O_WRONLY | O_NONBLOCK);
    if (device_fd < 0) {
        char detail[256];
        snprintf(detail, sizeof(detail),
                 "Cannot open /dev/uinput: %s. Install the udev rule and reconnect your session.",
                 strerror(errno));
        emit_status(errno == EACCES ? "permission-denied" : "uinput-unavailable", detail);
        return -1;
    }

    if (ioctl(device_fd, UI_SET_EVBIT, EV_KEY) < 0 ||
        ioctl(device_fd, UI_SET_EVBIT, EV_REL) < 0 ||
        ioctl(device_fd, UI_SET_RELBIT, REL_X) < 0 ||
        ioctl(device_fd, UI_SET_RELBIT, REL_Y) < 0 ||
        ioctl(device_fd, UI_SET_RELBIT, REL_WHEEL) < 0 ||
        ioctl(device_fd, UI_SET_RELBIT, REL_HWHEEL) < 0 ||
        enable_keys(device_fd) < 0) {
        emit_status("uinput-error", strerror(errno));
        return -1;
    }

    struct uinput_setup setup = {0};
    setup.id.bustype = BUS_VIRTUAL;
    setup.id.vendor = 0x524d;
    setup.id.product = 0x0001;
    setup.id.version = 1;
    snprintf(setup.name, UINPUT_MAX_NAME_SIZE, "Remote Mouse Virtual Input");

    if (ioctl(device_fd, UI_DEV_SETUP, &setup) < 0 || ioctl(device_fd, UI_DEV_CREATE) < 0) {
        emit_status("uinput-error", strerror(errno));
        return -1;
    }

    emit_status("ready", "uinput virtual pointer and keyboard are active");
    return 0;
}

static void destroy_device(void) {
    if (device_fd >= 0) {
        ioctl(device_fd, UI_DEV_DESTROY);
        close(device_fd);
        device_fd = -1;
    }
}

static bool handle_command(char *line) {
    double x = 0;
    double y = 0;
    int code = 0;
    int pressed = 0;

    if (strncmp(line, "STOP", 4) == 0) {
        return false;
    }
    if (sscanf(line, "MOVE %lf %lf", &x, &y) == 2) {
        pointer_remainder_x += x;
        pointer_remainder_y += y;
        int delta_x = (int)pointer_remainder_x;
        int delta_y = (int)pointer_remainder_y;
        pointer_remainder_x -= delta_x;
        pointer_remainder_y -= delta_y;
        emit_event(EV_REL, REL_X, delta_x);
        emit_event(EV_REL, REL_Y, delta_y);
        sync_events();
    } else if (sscanf(line, "BUTTON %d %d", &code, &pressed) == 2) {
        emit_event(EV_KEY, (unsigned short)code, pressed ? 1 : 0);
        sync_events();
    } else if (sscanf(line, "SCROLL %lf %lf", &x, &y) == 2) {
        scroll_remainder_x += x;
        scroll_remainder_y += y;
        int delta_x = (int)scroll_remainder_x;
        int delta_y = (int)scroll_remainder_y;
        scroll_remainder_x -= delta_x;
        scroll_remainder_y -= delta_y;
        emit_event(EV_REL, REL_HWHEEL, delta_x);
        emit_event(EV_REL, REL_WHEEL, delta_y);
        sync_events();
    } else if (sscanf(line, "KEY %d %d", &code, &pressed) == 2 && code >= 0 && code <= KEY_MAX) {
        emit_event(EV_KEY, (unsigned short)code, pressed ? 1 : 0);
        sync_events();
    }
    return true;
}

int main(void) {
    if (create_device() < 0) {
        destroy_device();
        return EXIT_FAILURE;
    }

    char *line = NULL;
    size_t capacity = 0;
    while (getline(&line, &capacity, stdin) >= 0 && handle_command(line)) {
    }
    free(line);
    destroy_device();
    return EXIT_SUCCESS;
}
