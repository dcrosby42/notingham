
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

export function arrayMoveItemBy(arr, by, item) {
    let i = null
    if (_.isFunction(item)) {
        i = _.findIndex(arr, item)
    } else {
        i = arr.indexOf(item)
    }
    if (i >= 0) {
        const j = (i + by) % arr.length
        arrayMove(arr, i, j)
    }
    return arr
}

export function arrayMoveItemRight(arr, item) {
    arrayMoveItemBy(arr, 1, item)
}

export function arrayMoveItemLeft(arr, item) {
    arrayMoveItemBy(arr, -1, item)
}
