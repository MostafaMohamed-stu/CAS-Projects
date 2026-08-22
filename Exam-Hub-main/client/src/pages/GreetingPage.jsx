import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { storage } from "../utils/storage";

const GreetingPage = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Read once inside effect to avoid re-triggering
    const userRole = (storage.getItem("userRole") || "").toLowerCase();
    const storedName = storage.getItem("userName") || "User";
    setDisplayName(storedName);

    // Auto-hide after 3 seconds and navigate
    const timer = setTimeout(() => {
      setIsVisible(false);
      
      // Delay navigation until exit animation completes (0.8s)
      setTimeout(() => {
        if (userRole === 'admin' || userRole === 'board' || userRole === 'superadmin') navigate('/superadmin');
        else if (userRole === 'teacher') navigate('/teacher');
        else if (userRole === 'student') navigate('/student');
        else navigate('/');
      }, 800);
    }, 3000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            color: 'black',
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            style={{ textAlign: 'center' }}
          >
            <h1 style={{ 
              fontSize: '4rem', 
              fontWeight: 900, 
              letterSpacing: '-0.05em',
              margin: 0
            }}>
              Hello, <span style={{ color: '#DC2626' }}>{displayName}</span>
            </h1>
            <p style={{ 
              marginTop: '1rem', 
              color: '#71717A', 
              fontWeight: 500, 
              textTransform: 'uppercase', 
              letterSpacing: '0.3em', 
              fontSize: '0.875rem' 
            }}>
              Welcome Back to Exams Hub
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GreetingPage;
