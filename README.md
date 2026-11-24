# Pocketly - Expense Tracking Application

## 📱 Overview
Pocketly is a mobile expense tracking application that helps users manage their daily expenses and events with multi-currency support. Built with React Native and Expo, it provides a simple and intuitive interface for tracking spending.

## 📊 Case Study: Real-World Usage

### User Story: Sarah - International Business Traveler

**Background:**
- Sarah is a business consultant who travels between Pakistan and Europe
- She needs to track expenses in different currencies
- She wants a simple way to manage her spending

**How Sarah Uses Pocketly:**

**Week 1 - In Pakistan**
- Opens Pocketly for first time (Default currency: USD)
- Switches to PKR (Pakistani Rupee)
- Adds expenses:
  - Restaurant: Rs. 5,000
  - Transport: Rs. 2,500
  - Shopping: Rs. 15,000
- **Total shown: Rs. 22,500**

**Week 2 - Traveling to Europe**
- Switches currency to EUR (Euro)
- Adds new expenses:
  - Hotel: €150
  - Meals: €80
  - Transport: €45
- **Total shown: €275**

**Week 3 - Monthly Review**
- Switches to USD to see overall spending
- All expenses automatically show in USD
- Can switch back to any currency anytime
- No manual calculations needed

**Benefits Sarah Experienced:**
- ✅ Easy currency switching with one tap
- ✅ All expenses show in selected currency automatically
- ✅ Can organize expenses by events (Business Trip 1, Business Trip 2)
- ✅ Simple interface, no confusion
- ✅ Perfect for expense reports

## 🎯 Key Features

### 1. Multi-Currency Support
**What it does:**
- Supports 4 currencies: USD, EUR, GBP, PKR
- Default currency: USD (when you sign up)
- Switch currency anytime with one tap
- All amounts automatically convert to selected currency

**How it works:**
- User selects preferred currency from menu
- All existing and new expenses display in that currency
- Currency preference is saved automatically

**Example:**
- User adds: €100
- Later switches to GBP: Shows £79
- Switches back to EUR: Shows €100 again

### 2. Expense Management
**Add Expenses:**
- Enter amount in your selected currency
- Add description (e.g., "Lunch at restaurant")
- Choose category (Food, Transport, Shopping, Bills, etc.)
- Save with one tap

**Edit Expenses:**
- Tap any expense to edit
- Amount shows in your current currency
- Update and save

**Delete Expenses:**
- Remove unwanted expenses
- Confirmation popup to prevent accidents

**Categories Available:**
- 🍔 Food
- 🚗 Transport
- 🛍️ Shopping
- 💡 Bills
- 🎬 Entertainment
- 💊 Health
- 📝 Other

### 3. Event-Based Tracking
**What it does:**
- Group expenses by events (trips, projects, occasions)
- Track total spending per event
- View all event expenses in one place

**Example Events:**
- "Europe Trip 2024"
- "Home Renovation"
- "Monthly Groceries"

**Benefits:**
- Organized expense tracking
- Easy to see event-specific costs
- Better financial planning

### 4. Expense Summary
**Features:**
- See total spending at a glance
- Filter by time (Today, This Month, All Time)
- Category-wise breakdown
- Real-time updates

**Display:**
- Total amount in selected currency
- Number of expenses
- Visual categorization

### 5. User Authentication
**Secure Login:**
- Email and password authentication
- Your data is private and secure
- Each user has their own account

**Profile Management:**
- View your profile
- **Edit Personal Details**: Update your First Name, Last Name, and Email Address.
- **Password Management**: Secure usage of your account.
- Logout option

**Forgot Password:**
- **Secure Recovery**: If you forget your password, request a reset link via email.
- **Deep Linking**: Seamlessly open the app from the reset link to choose a new password.

### 6. Smart Currency Conversion
**How It Works:**

| Action | What You See |
| :--- | :--- |
| **Add Expense** | Enter amount in current currency (e.g., €100) |
| **Display** | Always shows in your selected currency |
| **Switch Currency** | All amounts update automatically |
| **Edit** | Edit in your current currency |

**Example Flow:**
- Currency: EUR
- Add expense: €100
- Switch to PKR
- Same expense shows: Rs. 30,350
- Switch back to EUR
- Shows: €100

### 7. User-Friendly Interface
**Features:**
- Clean and modern design
- Easy navigation
- Quick actions
- Visual feedback
- Smooth animations

**Onboarding:**
- Welcome screen for new users
- Quick tour of features
- Easy to get started

## 🛠️ Technology Stack

### Mobile App Development
**Framework & Language:**
- React Native
- Expo (Development tools and platform)
- TypeScript (Type-safe JavaScript)

**UI Components:**
- React Native Core Components
- Ionicons (Icons)
- Custom styled components

**Navigation:**
- Expo Router (Screen navigation)
- Tab-based navigation

### Backend & Database
**Database:**
- Supabase (PostgreSQL database)
- Real-time data synchronization
- Cloud storage

**Authentication:**
- Supabase Auth
- Secure user sessions
- Email/password login

### Data Storage
**Local Storage:**
- AsyncStorage (Currency preferences)
- Offline data caching

**Cloud Storage:**
- Supabase Tables:
  - Expenses table
  - Events table
  - User profiles

### State Management
**React Features:**
- useState (Component state)
- useEffect (Side effects)
- useContext (Global state)
- Custom Hooks (Reusable logic)

**Context API:**
- AuthContext (User authentication)
- OnboardingContext (First-time user flow)

### Architecture
- Pattern: Component-Based Architecture
- Modular components
- Reusable UI elements
- Service layer for API calls

## 📈 Performance Features
- **Fast Loading:** Optimized component rendering
- **Smooth Scrolling:** Efficient list virtualization
- **Quick Actions:** Instant UI feedback
- **Offline Support:** Local data caching

## 🔒 Security
- **User Authentication:** Secure login system
- **Data Privacy:** Each user's data is isolated
- **Encrypted Storage:** Secure data transmission
- **Session Management:** Automatic logout options

## ✨ Key Benefits
**For Users:**
- ✅ No manual currency conversion needed
- ✅ Track expenses in multiple currencies
- ✅ Organize spending by events
- ✅ Simple and intuitive interface
- ✅ Secure and private

**For Developers:**
- • Modern React Native architecture
- • Type-safe with TypeScript
- • Scalable database design
- • Clean code structure
- • Easy to maintain and extend

## 🚀 Future Possibilities
- Budget alerts and spending limits
- Visual charts and analytics
- Export data to CSV/PDF
- Receipt photo upload
- Split bills with friends
- Recurring expense tracking
- Multi-device sync

## 📝 Summary
Pocketly is a complete expense tracking solution that makes managing money simple and efficient. With multi-currency support, event-based tracking, and an intuitive interface, users can:
- Track expenses in their preferred currency
- Organize spending by events
- View summaries and totals instantly
- Switch between currencies effortlessly
- Keep their financial data secure

**Built With:** React Native, Expo, TypeScript, Supabase
**Status:** ✅ Production Ready
