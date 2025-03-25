export function deepcopy(obj) {
    let objStr = JSON.stringify(obj);
    let outObj = JSON.parse(objStr);
    return outObj;
}
