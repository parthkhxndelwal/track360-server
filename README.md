# Track360: Urban Issues Monitoring Dashboard

Track360 is a platform for monitoring urban issues across India. The platform allows users to upload videos which are then processed to detect issues like broken roads, potholes, and other urban infrastructure problems.

## Features

- **Authentication**: Secure login system
- **Video Processing**: Upload videos for automated issue detection
- **Side-by-Side Comparison**: Compare original and processed videos
- **Real-time Detection Display**: View detections as they appear in the video with toast notifications
- **Location Mapping**: View the location of detected issues on an interactive map
- **Dashboard Analytics**: Comprehensive dashboard with statistics and trends
- **Rider Management**: Track active riders and reward distribution

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **UI Components**: Radix UI, Shadcn UI
- **Visualizations**: Recharts
- **Maps**: OpenStreetMap via Leaflet
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/track360.git
cd track360
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Login Credentials

For demo purposes, use the following credentials:
- **Email**: admin@municipal.com
- **Password**: admin341$

## Project Structure

- `app/`: Next.js app router
  - `api/`: Backend API routes
  - `dashboard/`: Dashboard pages
  - `login/`: Authentication pages
- `components/`: Reusable React components
  - `ui/`: UI components (buttons, cards, etc.)
- `lib/`: Utility functions and hooks
- `public/`: Static assets

## Future Enhancements

- **Real-time Updates**: Live updates from riders in the field
- **Advanced Analytics**: ML-based trend analysis and predictions
- **Mobile Application**: Native mobile app for riders
- **Notification System**: Alerts for new issues and critical detections
- **Integration with Municipal Systems**: Direct connection with city maintenance systems

## License

This project is licensed under the MIT License - see the LICENSE file for details. 