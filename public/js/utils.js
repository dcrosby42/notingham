
// Move an array element from one location to another.
// Supports negative indices.
// https://stackoverflow.com/a/5306832
export function arrayMove(arr, old_index, new_index) {
    while (old_index < 0) {
        old_index += arr.length;
    }
    while (new_index < 0) {
        new_index += arr.length;
    }
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
};

export function arrayMoveItemLeft(arr, item) {
    const i = arr.indexOf(item)
    const j = (i - 1) % arr.length
    arrayMove(arr, i, j)
    return arr
}

export function arrayMoveItemRight(arr, item) {
    const i = arr.indexOf(item)
    const j = (i + 1) % arr.length
    arrayMove(arr, i, j)
    return arr
}
