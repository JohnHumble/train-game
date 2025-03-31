export function deepcopy<T>(obj: T): T {
    let objStr = JSON.stringify(obj);
    let outObj = JSON.parse(objStr);
    return outObj;
}
