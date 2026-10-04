#include <errno.h>
#include <fcntl.h>
#include <linux/input-event-codes.h>
#include <linux/uinput.h>
#include <node_api.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>
#include <sys/ioctl.h>
#include <unistd.h>

static int pointer_fd = -1;
static int keyboard_fd = -1;
static double pointer_x_remainder, pointer_y_remainder;
static double scroll_x_remainder, scroll_y_remainder;

static void close_fd(int *fd) {
    if (*fd < 0) return;
    ioctl(*fd, UI_DEV_DESTROY);
    close(*fd);
    *fd = -1;
}

static void close_devices(void *data) {
    (void)data;
    close_fd(&pointer_fd);
    close_fd(&keyboard_fd);
}

static napi_value undefined_value(napi_env env) {
    napi_value result;
    napi_get_undefined(env, &result);
    return result;
}

static napi_value throw_errno(napi_env env, const char *prefix) {
    char message[256];
    snprintf(message, sizeof(message), "%s: %s", prefix, strerror(errno));
    napi_throw_error(env, errno == EACCES ? "UINPUT_PERMISSION_DENIED" : "UINPUT_ERROR", message);
    return NULL;
}

static bool require_open(napi_env env) {
    if (pointer_fd >= 0 && keyboard_fd >= 0) return true;
    napi_throw_error(env, "UINPUT_NOT_OPEN", "The uinput bridge is not open");
    return false;
}

static bool emit_event(int fd, unsigned short type, unsigned short code, int value) {
    struct input_event event = {0};
    event.type = type;
    event.code = code;
    event.value = value;
    return write(fd, &event, sizeof(event)) == (ssize_t)sizeof(event);
}

static napi_value sync_events(napi_env env, int fd) {
    return emit_event(fd, EV_SYN, SYN_REPORT, 0)
        ? undefined_value(env)
        : throw_errno(env, "Cannot write to /dev/uinput");
}

static int enable_keyboard_keys(int fd) {
    for (int code = 0; code < BTN_MISC; code++) {
        if (ioctl(fd, UI_SET_KEYBIT, code) < 0) return -1;
    }
    return 0;
}

static int create_pointer_device(void) {
    int fd = open("/dev/uinput", O_WRONLY | O_NONBLOCK);
    if (fd < 0) return -1;
    const unsigned short buttons[] = {
        BTN_LEFT, BTN_RIGHT, BTN_MIDDLE, BTN_SIDE, BTN_EXTRA, BTN_FORWARD, BTN_BACK, BTN_TASK,
    };
    if (ioctl(fd, UI_SET_EVBIT, EV_KEY) < 0 || ioctl(fd, UI_SET_EVBIT, EV_REL) < 0
        || ioctl(fd, UI_SET_RELBIT, REL_X) < 0 || ioctl(fd, UI_SET_RELBIT, REL_Y) < 0
        || ioctl(fd, UI_SET_RELBIT, REL_WHEEL) < 0 || ioctl(fd, UI_SET_RELBIT, REL_HWHEEL) < 0) {
        close(fd);
        return -1;
    }
    for (size_t index = 0; index < sizeof(buttons) / sizeof(buttons[0]); index++) {
        if (ioctl(fd, UI_SET_KEYBIT, buttons[index]) < 0) {
            close(fd);
            return -1;
        }
    }
    struct uinput_setup setup = {0};
    setup.id.bustype = BUS_VIRTUAL;
    setup.id.vendor = 0x524d;
    setup.id.product = 1;
    setup.id.version = 1;
    snprintf(setup.name, UINPUT_MAX_NAME_SIZE, "Remote Mouse Virtual Mouse");
    if (ioctl(fd, UI_DEV_SETUP, &setup) < 0 || ioctl(fd, UI_DEV_CREATE) < 0) {
        close(fd);
        return -1;
    }
    return fd;
}

static int create_keyboard_device(void) {
    int fd = open("/dev/uinput", O_WRONLY | O_NONBLOCK);
    if (fd < 0) return -1;
    if (ioctl(fd, UI_SET_EVBIT, EV_KEY) < 0 || enable_keyboard_keys(fd) < 0) {
        close(fd);
        return -1;
    }
    struct uinput_setup setup = {0};
    setup.id.bustype = BUS_VIRTUAL;
    setup.id.vendor = 0x524d;
    setup.id.product = 2;
    setup.id.version = 1;
    snprintf(setup.name, UINPUT_MAX_NAME_SIZE, "Remote Mouse Virtual Keyboard");
    if (ioctl(fd, UI_DEV_SETUP, &setup) < 0 || ioctl(fd, UI_DEV_CREATE) < 0) {
        close(fd);
        return -1;
    }
    return fd;
}

static napi_value open_bridge(napi_env env, napi_callback_info info) {
    (void)info;
    if (pointer_fd >= 0 && keyboard_fd >= 0) return undefined_value(env);
    pointer_fd = create_pointer_device();
    if (pointer_fd < 0) return throw_errno(env, "Cannot create uinput pointer");
    keyboard_fd = create_keyboard_device();
    if (keyboard_fd < 0) {
        napi_value error = throw_errno(env, "Cannot create uinput keyboard");
        close_devices(NULL);
        return error;
    }
    return undefined_value(env);
}

static bool read_pair(napi_env env, napi_callback_info info, double *first, double *second) {
    size_t argc = 2;
    napi_value argv[2];
    if (napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok || argc != 2 ||
        napi_get_value_double(env, argv[0], first) != napi_ok ||
        napi_get_value_double(env, argv[1], second) != napi_ok) {
        napi_throw_type_error(env, "UINPUT_INVALID_ARGUMENT", "Expected two numeric arguments");
        return false;
    }
    return true;
}

static napi_value move_relative(napi_env env, napi_callback_info info) {
    double x, y;
    if (!require_open(env) || !read_pair(env, info, &x, &y)) return NULL;
    pointer_x_remainder += x;
    pointer_y_remainder += y;
    int delta_x = (int)pointer_x_remainder;
    int delta_y = (int)pointer_y_remainder;
    pointer_x_remainder -= delta_x;
    pointer_y_remainder -= delta_y;
    if (!emit_event(pointer_fd, EV_REL, REL_X, delta_x)
        || !emit_event(pointer_fd, EV_REL, REL_Y, delta_y)) {
        return throw_errno(env, "Cannot move uinput pointer");
    }
    return sync_events(env, pointer_fd);
}

static napi_value scroll_pointer(napi_env env, napi_callback_info info) {
    double x, y;
    if (!require_open(env) || !read_pair(env, info, &x, &y)) return NULL;
    scroll_x_remainder += x;
    scroll_y_remainder += y;
    int delta_x = (int)scroll_x_remainder;
    int delta_y = (int)scroll_y_remainder;
    scroll_x_remainder -= delta_x;
    scroll_y_remainder -= delta_y;
    if (!emit_event(pointer_fd, EV_REL, REL_HWHEEL, delta_x)
        || !emit_event(pointer_fd, EV_REL, REL_WHEEL, delta_y)) {
        return throw_errno(env, "Cannot scroll uinput pointer");
    }
    return sync_events(env, pointer_fd);
}

static napi_value emit_input_key(napi_env env, napi_callback_info info, int fd) {
    double code_value, pressed_value;
    if (!require_open(env) || !read_pair(env, info, &code_value, &pressed_value)) return NULL;
    int code = (int)code_value;
    if (code < 0 || code > KEY_MAX) {
        napi_throw_range_error(env, "UINPUT_INVALID_KEY", "Key code is outside the Linux input range");
        return NULL;
    }
    if (!emit_event(fd, EV_KEY, (unsigned short)code, pressed_value != 0 ? 1 : 0)) {
        return throw_errno(env, "Cannot write uinput key");
    }
    return sync_events(env, fd);
}

static napi_value emit_button(napi_env env, napi_callback_info info) {
    return emit_input_key(env, info, pointer_fd);
}

static napi_value emit_keyboard_key(napi_env env, napi_callback_info info) {
    return emit_input_key(env, info, keyboard_fd);
}

static napi_value close_bridge(napi_env env, napi_callback_info info) {
    (void)info;
    close_devices(NULL);
    return undefined_value(env);
}

static napi_value initialize(napi_env env, napi_value exports) {
    napi_property_descriptor properties[] = {
        {"open", NULL, open_bridge, NULL, NULL, NULL, napi_default, NULL},
        {"moveRelative", NULL, move_relative, NULL, NULL, NULL, napi_default, NULL},
        {"scroll", NULL, scroll_pointer, NULL, NULL, NULL, napi_default, NULL},
        {"button", NULL, emit_button, NULL, NULL, NULL, napi_default, NULL},
        {"key", NULL, emit_keyboard_key, NULL, NULL, NULL, napi_default, NULL},
        {"close", NULL, close_bridge, NULL, NULL, NULL, napi_default, NULL},
    };
    napi_define_properties(env, exports, sizeof(properties) / sizeof(properties[0]), properties);
    napi_add_env_cleanup_hook(env, close_devices, NULL);
    return exports;
}

NAPI_MODULE(remote_mouse_uinput, initialize)
