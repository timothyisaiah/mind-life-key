export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateShort = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export const getMonthName = (monthIndex) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  return months[monthIndex]
}

export const getCurrentMonth = () => {
  return new Date().getMonth()
}

export const getCurrentYear = () => {
  return new Date().getFullYear()
}

export const getDaysInMonth = (month, year) => {
  return new Date(year, month + 1, 0).getDate()
}

export const isToday = (date) => {
  const today = new Date()
  const checkDate = new Date(date)
  return today.toDateString() === checkDate.toDateString()
}

export const isThisMonth = (date) => {
  const today = new Date()
  const checkDate = new Date(date)
  return (
    today.getMonth() === checkDate.getMonth() && today.getFullYear() === checkDate.getFullYear()
  )
}

export const getRelativeDate = (date) => {
  const now = new Date()
  const checkDate = new Date(date)
  const diffTime = Math.abs(now - checkDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`
  return `${Math.ceil(diffDays / 365)} years ago`
}
