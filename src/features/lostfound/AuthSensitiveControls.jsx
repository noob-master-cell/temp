import React from "react";
// import { ITEM_STATUS } from "../../config/constants"; // ITEM_STATUS import removed

const AuthSensitiveControls = ({ item, user, onEdit, onDelete }) => {
  // onMarkAsResolved prop removed
  if (user && user.uid === item.userId) {
    // Check if the item is already resolved - REMOVED
    // const isResolved = item.isResolved === true ||
    //                    item.status === ITEM_STATUS.FOUND_CLAIMED ||
    //                    item.status === ITEM_STATUS.LOST_RETURNED;

    return (
      <div className="p-2.5 bg-gray-100 border-t flex flex-wrap gap-2 mt-auto">
        {" "}
        {/* Added flex-wrap and gap */}
        <button
          onClick={() => onEdit(item)} // Pass item to onEdit
          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold py-1.5 px-2 rounded-md transition-colors min-w-[70px]" // Added min-width
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item.id)} // Pass itemId to onDelete
          className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold py-1.5 px-2 rounded-md transition-colors min-w-[70px]" // Added min-width
        >
          Delete
        </button>
      </div>
    );
  }
  return null; // Don't render controls if user is not the owner
};

export default AuthSensitiveControls;
