import i18n from '@dhis2/d2-i18n';
import checkPasswordForErrors from '../../utils/checkPasswordForErrors';
import {
    USERNAME,
    PASSWORD,
    REPEAT_PASSWORD,
    SURNAME,
    FIRST_NAME,
    EMAIL,
} from './config';

const CREATE_REQUIRED_FIELDS = new Set([
    USERNAME,
    PASSWORD,
    REPEAT_PASSWORD,
    SURNAME,
    FIRST_NAME,
]);
const INVITE_REQUIRED_FIELDS = new Set([EMAIL, SURNAME, FIRST_NAME]);
const EDIT_REQUIRED_FIELDS = new Set([SURNAME, FIRST_NAME]);

const EMAIL_ADDRESS_PATTERN = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
const INTERNATIONAL_PHONE_NUMBER_PATTERN = /^\+(?:[0-9].?){4,14}[0-9]$/;

const fieldSpecificValidatorLookup = {
    username,
    whatsApp,
    userRoles,
    password,
    email,
};

export default function collectValidators(
    props,
    name,
    isRequiredField,
    isAttributeField
) {
    const validators = [];
    const isEditingUser = Boolean(props.user.id);
    const isRequiredAttributeField = isAttributeField && isRequiredField;
    const fieldValidator = fieldSpecificValidatorLookup[name];
    const isRequiredStaticField =
        !isAttributeField && isEditingUser
            ? EDIT_REQUIRED_FIELDS.has(name)
            : props.inviteUser
                ? INVITE_REQUIRED_FIELDS.has(name)
                : CREATE_REQUIRED_FIELDS.has(name);

    if (fieldValidator) {
        validators.push(fieldValidator);
    }

    if (isRequiredAttributeField || isRequiredStaticField) {
        validators.push(required);
    }

    return validators;
}

function required(value) {
    return !Boolean(value) ? i18n.t('This field is required') : undefined;
}

function username(value) {
    if (value && value.length < 2) {
        return i18n.t('A username should be at least 2 characters long');
    }

    if (value && value.length > 140) {
        return i18n.t('Username may not exceed 140 characters');
    }
}

function whatsApp(value) {
    if (value && !INTERNATIONAL_PHONE_NUMBER_PATTERN.test(value)) {
        return i18n.t('Please provide a valid international phone number (+0123456789)');
    }
}

function userRoles(value, _, props) {
    const isEditingUser = Boolean(props.user.id);
    const unTouchedOnEdit = isEditingUser && !value;
    const isArrayWithLength = Array.isArray(value) && value.length > 0;

    if (!unTouchedOnEdit && !isArrayWithLength) {
        return i18n.t('A user should have at least one User Role');
    }
}

function password(value, allValues, props, name) {
    // Only skip on when editing user and both fields are blank
    const isEditingUser = Boolean(props.user.id);
    const emptyOnEdit =
        isEditingUser && !allValues[PASSWORD] && !allValues[REPEAT_PASSWORD];

    if (emptyOnEdit || props.inviteUser) {
        return;
    }

    const passwordError = checkPasswordForErrors(allValues[PASSWORD]);
    if (passwordError) {
        return passwordError;
    }

    if (name === REPEAT_PASSWORD && allValues[REPEAT_PASSWORD] !== allValues[PASSWORD]) {
        return i18n.t('Passwords do not match');
    }
}

function email(value) {
    if (value && !EMAIL_ADDRESS_PATTERN.test(value)) {
        return i18n.t('Please provide a valid email address');
    }
}

// LEGACY EXPORT STILL BEING USED BY OTHER COMPONENT, SHOULD BE REFACTORED AWAY
export function validateUsername(errors, username) {
    if (username && username.length < 2) {
        errors[USERNAME] = i18n.t('A username should be at least 2 characters long');
    }

    if (username && username.length > 140) {
        errors[USERNAME] = i18n.t('Username may not exceed 140 characters');
    }
}
