import { Routes, Route } from "react-router-dom";
import JoinExam from "../pages/candidate/JoinExam";
import SystemCheck from "../pages/candidate/SystemCheck";
import Dashboard from "../pages/admin/Dashboard";
import CandidateLayout from "../components/layout/CandidateLayout";
import AdminLayout from "../components/layout/AdminLayout";
import Exam from "../pages/candidate/Exam";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Candidate Routes */}
      <Route element={<CandidateLayout />}>
        <Route path="/join-exam" element={<JoinExam />} />
        <Route path="/system-check" element={<SystemCheck />} />
        <Route path="/exam" element={<Exam />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
