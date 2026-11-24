// Format amount in US Dollars
export const formatCurrency = (amount: number): string => {
  return `$ ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

// Format date - Always show professional dates (e.g., "19 Dec, 2025")
export const formatDate = (dateString: string, filterType: 'all' | 'month' | 'date' = 'date'): string => {
  const date = new Date(dateString);
  
  // Always show actual date in professional format
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
};

// Get category emoji
export const getCategoryEmoji = (category: string): string => {
  const emojiMap: { [key: string]: string } = {
    Food: '🍔',
    Transport: '🚗',
    Shopping: '🛍️',
    Bills: '💡',
    Entertainment: '🎬',
    Health: '💊',
    Other: '📝',
  };
  return emojiMap[category] || '📝';
};
