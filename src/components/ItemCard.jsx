import React, { useState, useCallback, useMemo, memo } from "react";
import WhatsAppIcon from "./icons/WhatsAppIcon";
import ShoppingBagIcon from "./icons/ShoppingBagIcon";
import ChevronLeftIcon from "./icons/ChevronLeftIcon";
import ChevronRightIcon from "./icons/ChevronRightIcon";
import ImageViewer from "./ImageViewer";
import UserCircleIcon from "./icons/UserCircleIcon"; // Import UserCircleIcon
import {
  generateWhatsAppURL,
  formatPrice,
  formatRelativeTime,
  getPlaceholderImage,
} from "../utils/helpers"; // Assuming helpers.js is in ../utils/

// Progressive Image Component
const ProgressiveImage = memo(({ src, alt, className, onClick, itemName }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
    };
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (hasError) {
    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center`}
        onClick={onClick}
      >
        <ShoppingBagIcon className="w-16 h-16 text-gray-400" />
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className={`${className} bg-gray-200 animate-pulse`} />
      )}
      <img
        src={imageSrc || getPlaceholderImage(itemName || "Loading...")}
        alt={alt}
        className={`${className} ${
          isLoading ? "opacity-0" : "opacity-100"
        } transition-opacity duration-300`}
        onClick={onClick}
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = getPlaceholderImage(itemName || "No Image");
        }}
      />
    </>
  );
});
ProgressiveImage.displayName = "ProgressiveImage";

// Item Detail Modal Component
const ItemDetailModal = memo(
  ({
    item,
    isOpen,
    onClose,
    onContact,
    isLostAndFound,
    showMessage,
    hideContactButton,
    user,
  }) => {
    // Added user prop
    if (!isOpen) return null;

    const posterName = item.userDisplayName || item.userEmail || "Anonymous";
    const formattedPrice =
      !isLostAndFound && item.price != null
        ? formatPrice
          ? formatPrice(item.price)
          : `€${Number(item.price).toFixed(2)}`
        : null;
    const formattedTime = item.createdAt
      ? formatRelativeTime(item.createdAt)
      : null;
    const whatsappUrl = item.whatsappNumber
      ? generateWhatsAppURL(item.whatsappNumber, item.name)
      : null;

    const handleContactClick = useCallback(() => {
      if (whatsappUrl) {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      } else if (item.whatsappNumber) {
        showMessage?.("Invalid WhatsApp number format.", "error");
      } else {
        onContact?.(item);
      }
    }, [whatsappUrl, item, onContact, showMessage]);

    const primaryImageUrl =
      item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : null;

    // Placeholder for Q&A state and functions
    const [questions, setQuestions] = useState([]); // This would be populated from Firestore
    const [newQuestionText, setNewQuestionText] = useState("");
    const handlePostQuestion = useCallback(() => {
      if (newQuestionText.trim() && user) {
        // In a real app, this would send the question to Firestore
        console.log("Posting question:", newQuestionText, "by", user.uid);
        showMessage("Question posted (simulated)!", "info");
        setNewQuestionText("");
        // Simulate adding a question
        setQuestions((prev) => [
          ...prev,
          {
            id: Date.now(),
            userId: user.uid,
            userName: user.displayName || user.email,
            questionText: newQuestionText,
            createdAt: new Date(),
            answerText: null,
            answeredAt: null,
          },
        ]);
      } else {
        showMessage("Please log in and type a question.", "warning");
      }
    }, [newQuestionText, user, showMessage]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-4 border-b">
            <h2
              className="text-2xl font-semibold text-gray-800 truncate"
              title={item.name || "Item Details"}
            >
              {item.name || "Item Details"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
              aria-label="Close modal"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 overflow-y-auto flex-grow sm:p-6">
            {/* Image Section */}
            {primaryImageUrl && (
              <div className="mb-6 rounded-lg overflow-hidden shadow">
                <ProgressiveImage
                  src={primaryImageUrl}
                  alt={item.name || "Item Image"}
                  className="w-full h-64 object-cover"
                  itemName={item.name}
                />
              </div>
            )}
            {!primaryImageUrl && (
              <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg mb-6 shadow">
                <ShoppingBagIcon className="w-24 h-24 text-gray-400" />
              </div>
            )}

            {/* Price */}
            {formattedPrice && (
              <p className="text-3xl font-bold text-indigo-600 mb-4">
                {formattedPrice}
              </p>
            )}

            {/* Description */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-700 mb-1">
                Description
              </h4>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {item.description || "No description available."}
              </p>
            </div>

            {/* Lost & Found specific info */}
            {isLostAndFound && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                <h4 className="text-md font-semibold text-blue-700 mb-1">
                  Lost & Found Details
                </h4>
                {item.lastSeenLocation && (
                  <p className="text-sm text-blue-600">
                    <span className="font-medium">Last seen:</span>{" "}
                    {item.lastSeenLocation}
                  </p>
                )}
                {item.dateFound?.seconds && (
                  <p className="text-sm text-blue-600">
                    <span className="font-medium">Date:</span>{" "}
                    {new Date(
                      item.dateFound.seconds * 1000
                    ).toLocaleDateString()}
                  </p>
                )}
                {!item.lastSeenLocation && !item.dateFound?.seconds && (
                  <p className="text-sm text-blue-600">
                    No specific lost & found details provided.
                  </p>
                )}
              </div>
            )}

            {/* Other Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
              <div>
                <span className="font-semibold text-gray-700">Category:</span>
                <span className="text-gray-600 ml-1">
                  {item.category || "N/A"}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Posted by:</span>
                <span
                  className="text-gray-600 ml-1 truncate"
                  title={posterName}
                >
                  {posterName}
                </span>
              </div>
              {formattedTime && (
                <div>
                  <span className="font-semibold text-gray-700">Posted:</span>
                  <span className="text-gray-600 ml-1">{formattedTime}</span>
                </div>
              )}
              {item.condition && !isLostAndFound && (
                <div>
                  <span className="font-semibold text-gray-700">
                    Condition:
                  </span>
                  <span className="text-gray-600 ml-1">{item.condition}</span>
                </div>
              )}
            </div>

            {/* Questions & Answers Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-700 mb-3">
                Questions & Answers
              </h4>
              {user ? (
                <div className="mb-4">
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 resize-y"
                    rows="3"
                    placeholder="Ask a question about this item..."
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                  ></textarea>
                  <button
                    onClick={handlePostQuestion}
                    className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm"
                  >
                    Post Question
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">
                  <a
                    href="/auth/login"
                    className="text-indigo-600 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      showMessage?.("Please log in to ask questions.", "info");
                    }}
                  >
                    Log in
                  </a>{" "}
                  to ask a question.
                </p>
              )}

              {questions.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No questions yet. Be the first to ask!
                </p>
              ) : (
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="bg-gray-50 p-3 rounded-md border border-gray-200"
                    >
                      <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
                        <UserCircleIcon className="w-4 h-4 mr-1 text-gray-500" />
                        <span>{q.userName || "Anonymous User"}</span>
                        <span className="text-gray-500 ml-2 text-xs font-normal">
                          {formatRelativeTime(q.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-800 text-sm mb-2 leading-relaxed">
                        {q.questionText}
                      </p>
                      {q.answerText ? (
                        <div className="mt-2 pt-2 border-t border-gray-200 flex items-start space-x-2">
                          <div className="flex-shrink-0">
                            <UserCircleIcon className="w-4 h-4 text-indigo-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-indigo-700 font-medium text-sm">
                              Seller's Answer:
                            </p>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {q.answerText}
                            </p>
                            <span className="text-gray-500 ml-1 text-xs font-normal">
                              {formatRelativeTime(q.answeredAt)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        user &&
                        user.uid === item.userId && ( // Only item owner can answer
                          <button className="mt-2 text-indigo-600 hover:underline text-sm">
                            Answer Question
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer / Actions */}
          <div className="p-4 border-t flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            {!hideContactButton && ( // Conditionally render contact button
              <button
                onClick={handleContactClick}
                disabled={!item.whatsappNumber}
                className={`w-full sm:w-auto font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  item.whatsappNumber
                    ? isLostAndFound
                      ? "bg-green-500 hover:bg-green-600 text-white focus:ring-green-500"
                      : "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <WhatsAppIcon />
                <span>
                  {isLostAndFound ? "Contact Finder" : "Contact Seller"}
                </span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Close
            </button>
          </div>
          {!hideContactButton &&
            !item.whatsappNumber && ( // Conditionally render contact message
              <p className="text-xs text-red-500 px-4 pb-3 text-center sm:text-right">
                WhatsApp contact required by poster for direct messaging.
              </p>
            )}
        </div>
      </div>
    );
  }
);
ItemDetailModal.displayName = "ItemDetailModal";

const ItemCard = memo(
  ({
    item,
    onContact,
    isLostAndFound = false,
    showMessage,
    className = "",
    hideContactButton = false, // New prop
    user, // Accept user prop here
  }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); // New state for detail modal

    const images = useMemo(
      () => (item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : []),
      [item.imageUrls]
    );
    const currentImageUrl = useMemo(
      () => images[currentImageIndex] || null,
      [images, currentImageIndex]
    );
    const posterName = useMemo(
      () => item.userDisplayName || item.userEmail || "Anonymous",
      [item.userDisplayName, item.userEmail]
    );
    const hasMultipleImages = images.length > 1;
    const formattedPrice = useMemo(
      () =>
        !isLostAndFound && item.price != null
          ? formatPrice
            ? formatPrice(item.price)
            : `€${Number(item.price).toFixed(2)}`
          : null,
      [item.price, isLostAndFound]
    );
    const formattedTime = useMemo(
      () => (item.createdAt ? formatRelativeTime(item.createdAt) : null),
      [item.createdAt]
    );
    const whatsappUrl = useMemo(
      () =>
        item.whatsappNumber
          ? generateWhatsAppURL(item.whatsappNumber, item.name)
          : null,
      [item.whatsappNumber, item.name]
    );

    const nextImage = useCallback(
      (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
      },
      [images.length]
    );

    const prevImage = useCallback(
      (e) => {
        e.stopPropagation();
        setCurrentImageIndex(
          (prevIndex) => (prevIndex - 1 + images.length) % images.length
        );
      },
      [images.length]
    );

    const openImageViewer = useCallback((e) => {
      e.stopPropagation();
      setIsImageViewerOpen(true);
    }, []);
    const closeImageViewer = useCallback(() => setIsImageViewerOpen(false), []);

    const openDetailModal = useCallback(() => setIsDetailModalOpen(true), []);
    const closeDetailModal = useCallback(() => setIsDetailModalOpen(false), []);

    const handleContactClick = useCallback(() => {
      if (whatsappUrl) {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      } else if (item.whatsappNumber) {
        showMessage?.("Invalid WhatsApp number format.", "error");
      } else {
        onContact?.(item);
      }
    }, [whatsappUrl, item, onContact, showMessage]);

    const ImageContainer = memo(() => (
      <div className="relative w-full h-48 sm:h-56 bg-gray-200 overflow-hidden group">
        {" "}
        {/* Adjusted image height for mobile */}
        {currentImageUrl ? (
          <>
            <ProgressiveImage
              src={currentImageUrl}
              alt={`${item.name || "Item Image"} ${
                hasMultipleImages
                  ? `(${currentImageIndex + 1}/${images.length})`
                  : ""
              }`}
              className="w-full h-full object-cover transition-all duration-300 cursor-pointer hover:scale-105"
              onClick={openImageViewer}
              itemName={item.name}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300 pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white bg-opacity-90 rounded-full p-3">
                  <svg
                    className="w-6 h-6 text-gray-800"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-gray-100 cursor-pointer"
            onClick={openImageViewer}
          >
            <ShoppingBagIcon className="w-16 h-16 text-gray-400" />
          </div>
        )}
        {hasMultipleImages && (
          <>
            <button
              onClick={prevImage}
              className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1.5 rounded-full hover:bg-opacity-70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Next image"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
              {currentImageIndex + 1} / {images.length}
            </div>
            <div className="absolute bottom-2 left-2 flex space-x-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex
                      ? "bg-white"
                      : "bg-white bg-opacity-50 hover:bg-opacity-75"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
        {images.length > 0 && (
          <button
            onClick={openImageViewer}
            className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full hover:bg-opacity-80 transition-all"
          >
            📷 {images.length} {images.length === 1 ? "Photo" : "Photos"}
          </button>
        )}
      </div>
    ));
    ImageContainer.displayName = "ImageContainer";

    const ItemInfo = memo(() => (
      <div className="p-4 flex-grow flex flex-col sm:p-5">
        {" "}
        {/* Reduced padding for mobile */}
        <div className="flex-grow">
          <h3
            className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2"
            title={item.name}
          >
            {item.name || "Untitled Item"}
          </h3>
          <p className="text-gray-600 mb-3 text-sm leading-relaxed line-clamp-3">
            {item.description || "No description available."}
          </p>
          {formattedPrice && (
            <p className="text-2xl font-bold text-indigo-600 mb-3">
              {formattedPrice}
            </p>
          )}
          {isLostAndFound && (
            <div className="mb-3 space-y-1">
              {item.lastSeenLocation && (
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Last seen:</span>{" "}
                  {item.lastSeenLocation}
                </p>
              )}
              {item.dateFound?.seconds && (
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(item.dateFound.seconds * 1000).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
          <div className="space-y-1 mb-4">
            <p className="text-xs text-gray-400">
              <span className="font-medium">Category:</span>{" "}
              {item.category || "N/A"}
            </p>
            <p className="text-xs text-gray-400 truncate" title={posterName}>
              <span className="font-medium">By:</span> {posterName}
            </p>
            {formattedTime && (
              <p className="text-xs text-gray-400">
                <span className="font-medium">Posted:</span> {formattedTime}
              </p>
            )}
          </div>
        </div>
        <div className="mt-auto pt-4">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            {!hideContactButton && ( // Conditionally render contact button
              <button
                onClick={handleContactClick}
                disabled={!item.whatsappNumber}
                className={`flex-1 font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  item.whatsappNumber
                    ? isLostAndFound
                      ? "bg-green-500 hover:bg-green-600 text-white focus:ring-green-500"
                      : "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-500"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <WhatsAppIcon />
                <span>{isLostAndFound ? "Contact" : "Contact Seller"}</span>
              </button>
            )}
            {/* View Details Button */}
            <button
              onClick={openDetailModal}
              className={`flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 ${
                hideContactButton ? "w-full" : ""
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span>View Details</span>
            </button>
          </div>
          {!hideContactButton &&
            !item.whatsappNumber && ( // Conditionally render contact message
              <p className="text-xs text-red-500 mt-2 text-center">
                WhatsApp contact required by poster
              </p>
            )}
        </div>
      </div>
    ));
    ItemInfo.displayName = "ItemInfo";

    return (
      <>
        <div
          className={`bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300 flex flex-col h-full ${className}`}
        >
          <ImageContainer />
          <ItemInfo />
        </div>
        <ImageViewer
          images={images}
          initialIndex={currentImageIndex}
          isOpen={isImageViewerOpen}
          onClose={closeImageViewer}
          itemName={item.name || "Item"}
        />
        {/* Item Detail Modal */}
        <ItemDetailModal
          item={item}
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          onContact={onContact} // Pass onContact if modal needs it directly
          isLostAndFound={isLostAndFound}
          showMessage={showMessage} // Pass showMessage for consistency
          hideContactButton={hideContactButton} // Pass new prop to modal
          user={user} // Pass user prop to ItemDetailModal
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.status === nextProps.item.status &&
      prevProps.item.name === nextProps.item.name &&
      prevProps.item.price === nextProps.item.price &&
      prevProps.item.imageUrls?.length === nextProps.item.imageUrls?.length &&
      prevProps.item.imageUrls?.[0] === nextProps.item.imageUrls?.[0] &&
      prevProps.isLostAndFound === nextProps.isLostAndFound &&
      prevProps.hideContactButton === nextProps.hideContactButton &&
      prevProps.user?.uid === nextProps.user?.uid // Compare user UID for re-render optimization
    );
  }
);
ItemCard.displayName = "ItemCard";
export default ItemCard;
