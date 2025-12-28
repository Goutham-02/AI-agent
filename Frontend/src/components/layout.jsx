import { Outlet } from "react-router-dom";
import Navbar from "./navbar";

export default function Layout() {
    return (
        <div className="min-h-screen bg-base-100 flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto p-4">
                <Outlet />
            </main>
            <footer className="footer footer-center p-4 bg-base-300 text-base-content">
                <aside>
                    <p>Copyright © {new Date().getFullYear()} - AI Ticket System</p>
                </aside>
            </footer>
        </div>
    );
}
