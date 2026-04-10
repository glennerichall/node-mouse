export function createTouchList(touchpad, touch) {
    return [
        new Touch({
            identifier: touch.identifier,
            target: touchpad,
            clientX: touch.clientX,
            clientY: touch.clientY,
            screenX: touch.screenX ?? touch.clientX,
            screenY: touch.screenY ?? touch.clientY,
            pageX: touch.pageX ?? touch.clientX,
            pageY: touch.pageY ?? touch.clientY,
            radiusX: touch.radiusX ?? 1,
            radiusY: touch.radiusY ?? 1,
            rotationAngle: touch.rotationAngle ?? 0,
            force: touch.force ?? 0.5,
        }),
    ];
}