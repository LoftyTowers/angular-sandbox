import { HttpContextToken } from '@angular/common/http';

export const INLINE_ERROR_HANDLING = new HttpContextToken<boolean>(() => false);
export const ENABLE_GET_RETRY = new HttpContextToken<boolean>(() => true);
