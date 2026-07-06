import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { currentUser } = useAuth();

  // If the user is not logged in, go to the main page
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <h1>Welcome to AI Chat Assistant</h1>

        <p>You are successfully logged in.</p>

        <p>
          This Home page is ready. You can customize it anytime.
        </p>
      </div>
    </div>
  );
}