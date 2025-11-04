import {  EntryCreateDto } from '../../../../generated/openapi';

/* 
export interface EntryCreateDto { 
    
    standardApplicantCode?: string;
    
    applicationCode: string;
    applicant?: Applicant;
    respondent?: Respondent;
   
    numberOfRespondents?: number;
    
    wordingFields?: Array<string>;
    feeStatuses?: Array<FeeStatus>;
    
    hasOffsiteFee?: boolean;
    
    caseReference?: string;
    
    accountNumber?: string;
    
    notes?: string;
    
    lodgementDate?: string;
}

*/


export function appListEntryCreateParams(): EntryCreateDto {

    const payload = {
        applicationCode: 'code',
    };

    return payload;
}