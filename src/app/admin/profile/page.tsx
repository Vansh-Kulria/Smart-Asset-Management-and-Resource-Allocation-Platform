import React from "react";
import Header from "../../../components/Header";
import ProfileForm from "../../../components/ProfileForm";

export default function AdminProfilePage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Admin Profile" />
      <main className="flex-1 p-8">
        <ProfileForm />
      </main>
    </div>
  );
}
