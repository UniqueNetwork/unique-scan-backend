export function strToUTF16(str: string): any {
  const buf: number[] = [];

  for (let i = 0, strLen = str.length; i < strLen; i++) {
    buf.push(str.charCodeAt(i));
  }

  return buf;
}

export function utf16ToStr(buf: number[]): string {
  let str = '';
  for (let i = 0, strLen = buf.length; i < strLen; i++) {
    if (buf[i] != 0) {
      str += String.fromCharCode(buf[i]);
    } else {
      break;
    }
  }
  return str;
}
