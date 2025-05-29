import React from "react";
import SearchIcon from "./icons/SearchIcon";
import ShoppingBagIcon from "./icons/ShoppingBagIcon";
import UserCircleIcon from "./icons/UserCircleIcon";

const iconMap = {
  search: SearchIcon,
  shopping: ShoppingBagIcon,
  user: UserCircleIcon,
};

const EmptyState = ({
  icon = "search",
  title = "No items found",
  description = "Try adjusting your search criteria or check back later.",
  actionButton = null,
  className = "",
}) => {
  const IconComponent = iconMap[icon] || SearchIcon;

  return (
    <div className={`text-center py-16 px-4 ${className}`}>
      <IconComponent className="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {actionButton && (
        <div className="flex justify-center">{actionButton}</div>
      )}
    </div>
  );
};

export default EmptyState;
export { EmptyState }; // Also export as named export for compatibility
