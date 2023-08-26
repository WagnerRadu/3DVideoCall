export const arrayBufferToString = (buffer) => {

    var bufView = new Uint8Array(buffer);
    var length = bufView.length;
    var result = '';
    var addition = Math.pow(2,16)-1;

    for(var i = 0;i<length;i+=addition){

        if(i + addition > length){
            addition = length - i;
        }
        result += String.fromCharCode.apply(null, bufView.subarray(i,i+addition));
    }

    return result;
}

export const stringToArrayBuffer = (string) => {
    var buf = new ArrayBuffer(string.length*2); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=string.length; i<strLen; i++) {
      bufView[i] = string.charCodeAt(i);
    }
    return buf;
  }


export const concatUint8Arrays = (slices) => {
    let length = 0;
    slices.forEach(item => {
        length += item.length;
    });

    let array = new Uint8Array(length);
    let offset = 0;
    slices.forEach(item => {
        array.set(item, offset);
        offset += item.length;
    });

    return array;
}