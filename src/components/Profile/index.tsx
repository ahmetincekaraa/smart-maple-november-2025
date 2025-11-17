import type { UserInstance } from "../../models/user";
import AuthSession from "../../utils/session";
import "../profileCalendar.scss";

type ProfileCardProps = {
    profile: UserInstance;
};

const ProfileCard = ({ profile }: ProfileCardProps) => {
  let roleDisplay = "";
  
  if(profile?.role) {
    if(typeof profile.role === 'object' && profile.role !== null) {
      roleDisplay = profile.role.name || JSON.stringify(profile.role);
    } else {
      roleDisplay = String(profile.role);
    }
  } else if(profile?.departments && profile.departments.length > 0) {
    const currentDept = profile.departments.find(d => d.departmentId === profile.currentDepartmentId);
    if(currentDept) {
      roleDisplay = String(currentDept.role);
    } else {
      roleDisplay = String(profile.departments[0].role);
    }
  } else {
    const sessionRole = AuthSession.getRoles();
    if(sessionRole) {
      if(typeof sessionRole === 'object' && sessionRole !== null) {
        const roleObj = sessionRole as { name?: string };
        roleDisplay = roleObj.name || String(sessionRole);
      } else {
        roleDisplay = String(sessionRole);
      }
    } else {
      roleDisplay = "User";
    }
  }
  
  return (
    <div className="profile-section">
      <div className="profile-info">
        <h2>Welcome, {profile?.name || "Guest"}</h2>
        <p>{profile?.email ?? AuthSession.getEmail()}</p>
        <p>Role: {roleDisplay}</p>
      </div>
    </div>
  );
};

export default ProfileCard;