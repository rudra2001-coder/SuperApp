export function validateField(value, rules) {
  const errors = [];
  if (!rules || rules.length === 0) return errors;

  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && !value.trim()))
          errors.push(rule.message || 'This field is required');
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          errors.push(rule.message || 'Invalid email format');
        break;
      case 'regex':
        if (value && rule.pattern && !new RegExp(rule.pattern).test(value))
          errors.push(rule.message || 'Invalid format');
        break;
      case 'min':
        if (value !== undefined && value !== null && Number(value) < rule.value)
          errors.push(rule.message || `Minimum value is ${rule.value}`);
        break;
      case 'max':
        if (value !== undefined && value !== null && Number(value) > rule.value)
          errors.push(rule.message || `Maximum value is ${rule.value}`);
        break;
      case 'minLength':
        if (value && value.length < rule.value)
          errors.push(rule.message || `Minimum length is ${rule.value}`);
        break;
      case 'maxLength':
        if (value && value.length > rule.value)
          errors.push(rule.message || `Maximum length is ${rule.value}`);
        break;
    }
  }
  return errors;
}

export function validateAllFields(data, templateFields) {
  const results = {};
  for (const field of templateFields) {
    const value = data[field.name];
    const errors = validateField(value, field.rules);
    if (errors.length > 0) results[field.name] = errors;
  }
  return results;
}
