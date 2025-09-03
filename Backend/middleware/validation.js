import validator from 'validator'

// Input validation helpers
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  return validator.isEmail(email) && email.length <= 254
}

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false
  return password.length >= 8 && password.length <= 128
}

export const validateName = (name) => {
  if (!name || typeof name !== 'string') return false
  return name.trim().length >= 2 && name.trim().length <= 50 && /^[a-zA-Z\s]+$/.test(name.trim())
}

export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false
  // More flexible phone validation - allow digits, spaces, dashes, parentheses, plus sign
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/
  return phoneRegex.test(phone.trim()) && phone.length <= 20
}

export const validateObjectId = (id) => {
  if (!id || typeof id !== 'string') return false
  return /^[0-9a-fA-F]{24}$/.test(id)
}

export const validatePrice = (price) => {
  const num = parseFloat(price)
  return !isNaN(num) && num >= 0 && num <= 999999.99
}

export const validateQuantity = (quantity) => {
  const num = parseInt(quantity)
  return !isNaN(num) && num >= 1 && num <= 100
}

// Sanitize string input
export const sanitizeString = (str, maxLength = 1000) => {
  if (!str || typeof str !== 'string') return ''
  return validator.escape(str.trim()).substring(0, maxLength)
}

// Validation middleware for user registration
export const validateUserRegistration = (req, res, next) => {
  const { name, email, password } = req.body
  
  const errors = []
  
  if (!validateName(name)) {
    errors.push('Name must be 2-50 characters and contain only letters and spaces')
  }
  
  if (!validateEmail(email)) {
    errors.push('Please provide a valid email address')
  }
  
  if (!validatePassword(password)) {
    errors.push('Password must be 8-128 characters long')
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }
  
  // Sanitize inputs
  req.body.name = sanitizeString(name, 50)
  req.body.email = email.toLowerCase().trim()
  
  next()
}

// Validation middleware for user login
export const validateUserLogin = (req, res, next) => {
  const { email, password } = req.body
  
  const errors = []
  
  if (!validateEmail(email)) {
    errors.push('Please provide a valid email address')
  }
  
  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required')
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }
  
  req.body.email = email.toLowerCase().trim()
  
  next()
}

// Validation middleware for profile updates
export const validateProfileUpdate = (req, res, next) => {
  const { name, phone } = req.body
  
  console.log('Profile validation - name:', name, 'phone:', phone)
  
  const errors = []
  
  if (name !== undefined && !validateName(name)) {
    console.log('Name validation failed for:', name)
    errors.push('Name must be 2-50 characters and contain only letters and spaces')
  }
  
  if (phone !== undefined && phone !== '' && !validatePhone(phone)) {
    console.log('Phone validation failed for:', phone)
    errors.push('Phone number must be 7-20 characters and contain only digits, spaces, dashes, parentheses, or plus sign')
  }
  
  if (errors.length > 0) {
    console.log('Validation errors:', errors)
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }
  
  // Sanitize inputs
  if (name !== undefined) {
    req.body.name = sanitizeString(name, 50)
  }
  
  next()
}

// Validation middleware for order placement
export const validateOrderPlacement = (req, res, next) => {
  const { items, address, amount } = req.body
  
  const errors = []
  
  if (!Array.isArray(items) || items.length === 0) {
    errors.push('Order must contain at least one item')
  }
  
  if (items && Array.isArray(items)) {
    items.forEach((item, index) => {
      if (!validateObjectId(item._id)) {
        errors.push(`Invalid product ID at item ${index + 1}`)
      }
      if (!validateQuantity(item.quantity)) {
        errors.push(`Invalid quantity at item ${index + 1}`)
      }
    })
  }
  
  if (!address || typeof address !== 'object') {
    errors.push('Shipping address is required')
  } else {
    if (!validateName(address.firstName)) {
      errors.push('Valid first name is required')
    }
    if (!validateName(address.lastName)) {
      errors.push('Valid last name is required')
    }
    if (!validateEmail(address.email)) {
      errors.push('Valid email is required')
    }
    if (!address.street || address.street.trim().length < 5) {
      errors.push('Valid street address is required')
    }
    if (!address.city || address.city.trim().length < 2) {
      errors.push('Valid city is required')
    }
    if (!address.zipcode || !/^[0-9]{5,10}$/.test(address.zipcode)) {
      errors.push('Valid zipcode is required')
    }
    if (!validatePhone(address.phone)) {
      errors.push('Valid phone number is required')
    }
  }
  
  if (!validatePrice(amount)) {
    errors.push('Invalid order amount')
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }
  
  // Sanitize address fields
  if (address) {
    req.body.address = {
      ...address,
      firstName: sanitizeString(address.firstName, 50),
      lastName: sanitizeString(address.lastName, 50),
      email: address.email.toLowerCase().trim(),
      street: sanitizeString(address.street, 200),
      city: sanitizeString(address.city, 100),
      state: sanitizeString(address.state, 100),
      country: sanitizeString(address.country, 100),
      zipcode: address.zipcode.trim()
    }
  }
  
  next()
}

// Validation middleware for product creation/update (admin)
export const validateProduct = (req, res, next) => {
  const { name, description, price, category, subCategory } = req.body
  
  const errors = []
  
  if (!name || name.trim().length < 2 || name.trim().length > 200) {
    errors.push('Product name must be 2-200 characters')
  }
  
  if (!description || description.trim().length < 10 || description.trim().length > 2000) {
    errors.push('Product description must be 10-2000 characters')
  }
  
  if (!validatePrice(price)) {
    errors.push('Invalid product price')
  }
  
  if (!category || category.trim().length < 2 || category.trim().length > 50) {
    errors.push('Valid category is required')
  }
  
  if (!subCategory || subCategory.trim().length < 2 || subCategory.trim().length > 50) {
    errors.push('Valid subcategory is required')
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }
  
  // Sanitize inputs
  req.body.name = sanitizeString(name, 200)
  req.body.description = sanitizeString(description, 2000)
  req.body.category = sanitizeString(category, 50)
  req.body.subCategory = sanitizeString(subCategory, 50)
  
  next()
}