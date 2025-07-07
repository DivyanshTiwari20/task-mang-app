import React, { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const RoleBasedAlert = ({ userRole, userName }) => {
  // Configuration for alerts - Modify these for your needs
  const alertConfig = {
    admin: {
      enabled: true,
      title: "Admin Notice",
      message: "Now you can see the profile of the user in dashboard page by clicking on the user name.",
      id: "admin_update_2024_001"
    },
    leader: {
      enabled: true,
      title: "Team Leader Alert",
      message: "Please update your profile information ASAP. Click on Settings in Sidebar, Also please remember to check out on the attendance.",
      id: "leader_profile_update_001"
    },
    employee: {
      enabled: false,
      title: "Employee Update",
      message: "Please update your profile information ASAP. Click on Settings in Sidebar, Also please remember to check out on the attendance.",
      id: "employee_contact_update_001"
    }
  };

  // State for dialog visibility
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState(null);

  // Check if user has already seen this alert
  const hasSeenAlert = (alertId) => {
    if (typeof window === 'undefined') return false; // SSR check
    const seenAlerts = JSON.parse(localStorage.getItem('seenAlerts') || '[]');
    return seenAlerts.includes(alertId);
  };

  // Mark alert as seen
  const markAlertAsSeen = (alertId) => {
    if (typeof window === 'undefined') return; // SSR check
    const seenAlerts = JSON.parse(localStorage.getItem('seenAlerts') || '[]');
    if (!seenAlerts.includes(alertId)) {
      seenAlerts.push(alertId);
      localStorage.setItem('seenAlerts', JSON.stringify(seenAlerts));
    }
  };

  // Check for alerts on component mount
  useEffect(() => {
    const checkForAlerts = () => {
      if (!userRole) return;
      
      const roleAlert = alertConfig[userRole.toLowerCase()];
      
      if (roleAlert && roleAlert.enabled && !hasSeenAlert(roleAlert.id)) {
        setAlertData(roleAlert);
        setShowAlert(true);
      }
    };

    // Small delay to ensure app is fully loaded
    const timer = setTimeout(checkForAlerts, 500);
    return () => clearTimeout(timer);
  }, [userRole]);

  // Handle alert close
  const handleCloseAlert = () => {
    if (alertData) {
      markAlertAsSeen(alertData.id);
    }
    setShowAlert(false);
    setAlertData(null);
  };

  // Don't render anything if no alert to show
  if (!showAlert || !alertData) {
    return null;
  }

  return (
    <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">
            {alertData.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 mt-2">
            {alertData.message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={handleCloseAlert}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md"
          >
            Got it
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RoleBasedAlert;