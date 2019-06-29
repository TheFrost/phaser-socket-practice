export const zeroPad = (number, size) => {
  let stringNumber = String(number)
  while (stringNumber.length < (size || 2)) {
    stringNumber = `0${stringNumber}`
  }
  return stringNumber
}
