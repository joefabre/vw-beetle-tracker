# 1969 VW Beetle Maintenance Tracker 🚗

![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Platform](https://img.shields.io/badge/Platform-Web-orange.svg)
![Classic Car](https://img.shields.io/badge/Classic%20Car-1969%20VW%20Beetle-red.svg)

A specialized maintenance tracking application designed specifically for classic 1969 Volkswagen Beetles. Keep detailed records of maintenance, repairs, issues, and service schedules to preserve your classic car's history and ensure optimal performance.

## 🚀 Live Demo

**Try it now**: [https://joefabre.github.io/vw-beetle-tracker/](https://joefabre.github.io/vw-beetle-tracker/)

## ✨ Features

### 🔧 **Comprehensive Maintenance Logging**
- **Detailed Records**: Track date, type, mileage, notes, and costs
- **Service Categories**: Oil changes, tune-ups, brakes, electrical, engine, transmission, suspension
- **Cost Tracking**: Monitor expenses with detailed financial records
- **Mileage Integration**: Link maintenance to specific odometer readings

### 📋 **Issue Tracking System**
- **Priority Management**: Categorize issues by priority (Low, Medium, High, Critical)
- **Status Tracking**: Separate current and resolved issues
- **Detailed Descriptions**: Comprehensive issue documentation
- **Date Tracking**: Monitor when issues were first noticed

### 📅 **Service Schedule Management**
- **Preventive Maintenance**: Built-in service intervals for classic VW maintenance
- **Due Date Tracking**: Automatic calculation of next service dates
- **Visual Status Indicators**: Color-coded status for overdue, due soon, and current services
- **Customizable Intervals**: Adjust service schedules to your driving patterns

### 📊 **Data Export & Reporting**
- **CSV Export**: Export maintenance data for external analysis
- **Print Functionality**: Generate professional maintenance reports
- **Email Integration**: Share issue lists and maintenance records
- **Data Backup**: Comprehensive data export for safekeeping

### 📱 **Mobile-Optimized Design**
- **Touch-Friendly Interface**: Optimized for garage and mobile use
- **Responsive Tables**: Adaptive layout for all screen sizes
- **Easy Data Entry**: Streamlined forms for quick updates
- **Offline Capability**: Works without internet connection

## 🛠️ Getting Started

### **Option 1: Online Usage (Recommended)**
Simply visit [https://joefabre.github.io/vw-beetle-tracker/](https://joefabre.github.io/vw-beetle-tracker/) in your web browser - perfect for garage use on tablets and phones!

### **Option 2: Local Installation**
1. **Clone the repository**:
   ```bash
   git clone https://github.com/joefabre/vw-beetle-tracker.git
   cd vw-beetle-tracker
   ```

2. **Open in browser**:
   ```bash
   # Open index.html directly, or serve with a local server:
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

## 📖 How to Use

### **Setting Up Your Vehicle**

1. **Vehicle Information**
   - Enter your VIN or chassis number
   - Set current mileage reading
   - Save your vehicle information

### **Logging Maintenance**

1. **Add Maintenance Record**
   - Select the date of service
   - Choose maintenance type from dropdown
   - Enter current mileage
   - Add detailed notes about work performed
   - Record costs for financial tracking

2. **Filter and Search**
   - Filter records by maintenance type
   - View comprehensive maintenance history
   - Track spending patterns over time

### **Issue Tracking**

1. **Report New Issues**
   - Document date issue was noticed
   - Provide detailed description
   - Set priority level (Low to Critical)
   - Track resolution progress

2. **Manage Issues**
   - Mark issues as resolved when fixed
   - Maintain historical record of problems
   - Export issue lists for mechanic consultations

### **Service Scheduling**

1. **Set Service Dates**
   - Input last service date for each category
   - Set next due date based on intervals
   - Monitor status indicators for upcoming services

2. **Track Service History**
   - View when services were last performed
   - Get alerts for overdue maintenance
   - Plan ahead with due date tracking

## 🎯 Classic VW Beetle Maintenance

### **Essential Service Categories**

#### **Engine Maintenance**
- **Oil Changes**: Every 3,000 miles or 6 months
- **Tune-ups**: Points, plugs, timing adjustment
- **Valve Adjustments**: Critical for air-cooled engines
- **Carburetor Service**: Cleaning and adjustment

#### **Electrical System**
- **6-Volt System**: Specialized classic car electrical
- **Generator Service**: Maintenance and repair
- **Wiring Inspection**: Check for vintage wire degradation
- **Light and Signal Maintenance**

#### **Suspension & Steering**
- **Front End Alignment**: Torsion bar adjustment
- **Shock Absorber Service**: Classic VW suspension
- **Steering Box Maintenance**: Gear box lubrication
- **Tire Rotation and Inspection**

#### **Transmission**
- **Fluid Changes**: Manual transmission service
- **Clutch Adjustment**: Cable and mechanism maintenance
- **CV Joint Service**: Drive axle maintenance

### **Common 1969 VW Beetle Issues**

- **Cooling System**: Air-cooled engine overheating
- **Fuel System**: Carburetor and fuel pump issues
- **Electrical**: 6-volt system troubleshooting
- **Heater System**: Vintage heating system maintenance
- **Body Work**: Rust prevention and repair

## 🔧 Technical Specifications

### **Browser Compatibility**
- Chrome 70+ (Recommended for garage tablets)
- Firefox 65+
- Safari 12+ (iOS compatible)
- Edge 79+
- Mobile browsers (fully responsive)

### **Technology Stack**
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Styling**: Responsive CSS with mobile-first design
- **Icons**: Font Awesome 6.0
- **Storage**: HTML5 localStorage (works offline)
- **Print**: CSS print optimizations

### **Data Storage**
- **Local Storage**: All data stored securely in browser
- **No Server Required**: Works completely offline
- **Privacy**: Your maintenance data stays on your device
- **Export Options**: CSV and print for external backup

## 📁 Project Structure

```
vw-beetle-tracker/
├── index.html                 # Main application interface
├── css/
│   └── styles.css            # Mobile-optimized styling
├── js/
│   ├── app.js                # Core application logic
│   ├── maintenance.js        # Maintenance tracking
│   ├── issues.js            # Issue management
│   └── export.js            # Data export functionality
├── assets/
│   ├── vw-icon.png          # Classic VW imagery
│   └── vw-logo.png          # Volkswagen branding
├── vw_beetle_data_*.csv     # Sample export data
└── README.md                # This documentation
```

## 🚀 Advanced Features

### **Firebase Integration** (Optional)
- Real-time data synchronization
- Multi-device access
- Cloud backup capabilities
- Sharing with mechanics or clubs

### **Diagnostic Tools**
- Troubleshooting guides for common issues
- Service interval recommendations
- Parts compatibility checker
- Classic VW resource links

### **Community Features**
- Share maintenance schedules with VW clubs
- Connect with other classic car enthusiasts
- Access to VW Beetle restoration resources

## 🎨 Customization

### **Service Intervals**
Adjust maintenance intervals based on your driving:
- **Daily Driver**: Standard intervals
- **Weekend Cruiser**: Extended intervals
- **Show Car**: Minimal wear schedules
- **Restoration Project**: Custom tracking

### **Issue Categories**
Customize issue types for your specific needs:
- **Body and Paint**
- **Interior Restoration**
- **Engine Performance**
- **Safety Systems**

## 📊 Data Export Features

### **CSV Export Options**
- Complete maintenance history
- Issue tracking records
- Service schedule data
- Cost analysis reports

### **Print Reports**
- Professional maintenance summaries
- Issue status reports
- Service schedule printouts
- Cost tracking statements

## 🤝 Contributing

Love classic cars and want to contribute? Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/classic-enhancement`)
3. Commit your changes (`git commit -m 'Add vintage feature'`)
4. Push to the branch (`git push origin feature/classic-enhancement`)
5. Open a Pull Request

### **Contribution Ideas**
- Additional classic car support (Porsche 356, early 911s)
- Enhanced reporting features
- Parts inventory tracking
- Integration with classic car parts suppliers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Volkswagen Community**: For preserving classic car knowledge
- **VW Beetle Enthusiasts**: Worldwide community of classic car lovers
- **Classic Car Mechanics**: For sharing maintenance expertise
- **Open Source Community**: For enabling collaborative development

## 🔗 Resources

### **VW Beetle Resources**
- [TheSamba.com](https://www.thesamba.com/) - Classic VW database
- [JBugs.com](https://www.jbugs.com/) - VW Beetle parts and guides
- [Wolfsburg West](https://wolfsburgwest.com/) - Restoration parts

### **Maintenance Guides**
- Classic VW maintenance schedules
- Air-cooled engine service procedures
- 6-volt electrical system guides

---

**Keep your classic running strong! 🚗💨**

*Track every mile, preserve the legacy at [https://joefabre.github.io/vw-beetle-tracker/](https://joefabre.github.io/vw-beetle-tracker/)*
