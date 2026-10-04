#include <dlfcn.h>
#include <node_api.h>
#include <stdbool.h>

typedef struct _XDisplay Display;
typedef unsigned long Window;

static napi_value set_visible(napi_env env, napi_callback_info info) {
    size_t argc = 2;
    napi_value argv[2];
    double window_value;
    bool visible;
    if (napi_get_cb_info(env, info, &argc, argv, NULL, NULL) != napi_ok || argc != 2 ||
        napi_get_value_double(env, argv[0], &window_value) != napi_ok ||
        napi_get_value_bool(env, argv[1], &visible) != napi_ok || window_value <= 0) {
        napi_throw_type_error(env, "XWAYLAND_INVALID_ARGUMENT", "Expected a window id and visibility boolean");
        return NULL;
    }

    bool changed = false;
    void *library = dlopen("libX11.so.6", RTLD_LAZY | RTLD_LOCAL);
    if (library != NULL) {
        Display *(*open_display)(const char *) = NULL;
        int (*close_display)(Display *) = NULL;
        int (*unmap_window)(Display *, Window) = NULL;
        int (*map_raised)(Display *, Window) = NULL;
        int (*flush)(Display *) = NULL;
        *(void **)(&open_display) = dlsym(library, "XOpenDisplay");
        *(void **)(&close_display) = dlsym(library, "XCloseDisplay");
        *(void **)(&unmap_window) = dlsym(library, "XUnmapWindow");
        *(void **)(&map_raised) = dlsym(library, "XMapRaised");
        *(void **)(&flush) = dlsym(library, "XFlush");
        if (open_display && close_display && unmap_window && map_raised && flush) {
            Display *display = open_display(NULL);
            if (display != NULL) {
                Window window = (Window)window_value;
                changed = visible ? map_raised(display, window) != 0 : unmap_window(display, window) != 0;
                flush(display);
                close_display(display);
            }
        }
        dlclose(library);
    }

    napi_value result;
    napi_get_boolean(env, changed, &result);
    return result;
}

static napi_value initialize(napi_env env, napi_value exports) {
    napi_property_descriptor properties[] = {
        {"setVisible", NULL, set_visible, NULL, NULL, NULL, napi_default, NULL},
    };
    napi_define_properties(env, exports, sizeof(properties) / sizeof(properties[0]), properties);
    return exports;
}

NAPI_MODULE(remote_mouse_xwayland_window, initialize)
