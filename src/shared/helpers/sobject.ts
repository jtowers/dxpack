import {
  RecordResult,
  SuccessResult,
  ErrorResult,
} from "jsforce/record-result";
export function resultIsSuccess(
  result: SuccessResult | ErrorResult | RecordResult[]
) {
  return "id" in result;
}
export function resultIsError(
  result: SuccessResult | ErrorResult | RecordResult[]
) {
  return "errors" in result;
}
