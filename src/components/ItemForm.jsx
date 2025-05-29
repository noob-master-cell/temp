import React, { useState, useEffect, useCallback } from "react";
import { auth, Timestamp } from "../firebase";
import firebaseService from "../services/firebaseService";
import { CATEGORIES, LIMITS } from "../config/constants"; // VALIDATION removed
import { validateWhatsApp, validateImageFile } from "../utils/helpers";
import XCircleIcon from "./icons/XCircleIcon";
import { LoadingSpinner } from "./LoadingSpinner";

const ItemForm = ({
  onSubmit,
  initialData = {},
  type = "sell",
  onFormProcessing,
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    lastSeenLocation: "", // Used for both lost and found: 'last seen' for lost, 'where found' for found
    dateFound: "", // Used for lost/found: date lost or date found
    whatsappNumber: "",
  });

  // Image state
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Determine if it's an "edit" operation
  const isEditMode = !!initialData.id;

  // Initialize form with existing data or default for new item
  useEffect(() => {
    const defaultDate = new Date().toISOString().split("T")[0]; // Today's date

    setFormData({
      name: initialData.name || "",
      description: initialData.description || "",
      price: initialData.price || "",
      category: initialData.category || "",
      whatsappNumber: initialData.whatsappNumber || "",
      // Lost & Found specific fields
      lastSeenLocation: initialData.lastSeenLocation || "",
      // If editing, use existing dateFound. If new "found" item, default to today. Else empty.
      dateFound: initialData.dateFound?.seconds
        ? new Date(initialData.dateFound.seconds * 1000)
            .toISOString()
            .split("T")[0]
        : type === "lostfound" && initialData.status === "found" && !isEditMode
        ? defaultDate
        : "",
    });

    const initialUrls = initialData.imageUrls || [];
    setImagePreviews([...initialUrls]);
    setExistingImageUrls([...initialUrls]);
    setImageFiles([]);
  }, [initialData, type, isEditMode]);

  // Get categories based on type
  const categories = type === "sell" ? CATEGORIES.SELL : CATEGORIES.LOST_FOUND;

  // Form field handlers
  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (error) setError(""); // Clear error when user types
    },
    [error]
  );

  // Image handling
  const handleImageChange = useCallback(
    (e) => {
      setError("");
      const files = Array.from(e.target.files);

      const currentTotalImages = imagePreviews.length;
      if (currentTotalImages + files.length > LIMITS.MAX_IMAGES) {
        setError(
          `You can upload a maximum of ${LIMITS.MAX_IMAGES} images. You currently have ${currentTotalImages}.`
        );
        e.target.value = null;
        return;
      }

      const validFiles = [];
      const newPreviews = [];

      files.forEach((file) => {
        const validation = validateImageFile(file, LIMITS.MAX_IMAGE_SIZE);
        if (!validation.isValid) {
          setError(validation.error);
          return;
        }

        validFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      });

      if (validFiles.length > 0) {
        setImageFiles((prev) => [...prev, ...validFiles]);
        setImagePreviews((prev) => [...prev, ...newPreviews]);
      }

      e.target.value = null; // Reset file input
    },
    [imagePreviews.length]
  );

  const removeImage = useCallback(
    (indexToRemove) => {
      const previewToRemove = imagePreviews[indexToRemove];
      const isExisting = existingImageUrls.includes(previewToRemove);

      if (isExisting) {
        setExistingImageUrls((prev) =>
          prev.filter((url) => url !== previewToRemove)
        );
      } else {
        // Find the corresponding file index for new images
        let fileIndexToRemove = -1;
        let newFileCount = 0;

        for (let i = 0; i <= indexToRemove; i++) {
          if (!existingImageUrls.includes(imagePreviews[i])) {
            if (i === indexToRemove) {
              fileIndexToRemove = newFileCount;
              break;
            }
            newFileCount++;
          }
        }

        if (fileIndexToRemove !== -1) {
          setImageFiles((prev) =>
            prev.filter((_, i) => i !== fileIndexToRemove)
          );
        }
      }

      setImagePreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
    },
    [imagePreviews, existingImageUrls]
  );

  // Form validation
  const validateForm = useCallback(() => {
    const { name, description, category, price, whatsappNumber } = formData;

    if (!name.trim() || !description.trim() || !category) {
      return "Name, Description, and Category are required.";
    }

    if (
      type === "sell" &&
      (price === "" || isNaN(parseFloat(price)) || parseFloat(price) < 0)
    ) {
      return "A valid price is required for items for sale.";
    }

    // For "found" items, dateFound should ideally be provided
    if (
      type === "lostfound" &&
      initialData.status === "found" &&
      !formData.dateFound
    ) {
      // return "Date Found is recommended for found items."; // Can be a warning or required
    }

    const whatsappValidation = validateWhatsApp(whatsappNumber);
    if (!whatsappValidation.isValid) {
      return whatsappValidation.error;
    }

    if (imagePreviews.length === 0) {
      return "Please upload at least one image for the item.";
    }

    return null;
  }, [formData, type, imagePreviews.length, initialData.status]);

  // Form submission
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsSubmitting(true);
      onFormProcessing?.(true);

      try {
        // Upload new images
        const finalImageUrls = [...existingImageUrls];

        if (imageFiles.length > 0) {
          const uploadResult = await firebaseService.uploadMultipleImages(
            imageFiles,
            type
          );

          if (uploadResult.failed.length > 0) {
            throw new Error(
              `Some images failed to upload: ${uploadResult.failed.join(", ")}`
            );
          }

          finalImageUrls.push(
            ...uploadResult.successful.map((result) => result.url)
          );
        }

        // Prepare item data
        const currentUser = auth.currentUser;
        const { whatsappNumber } = formData;
        const whatsappValidation = validateWhatsApp(whatsappNumber);

        const itemData = {
          ...formData,
          name: formData.name.trim(),
          description: formData.description.trim(),
          whatsappNumber: whatsappValidation.cleanNumber,
          imageUrls: finalImageUrls,
          userId: currentUser?.uid,
          userEmail: currentUser?.email,
          userDisplayName: currentUser?.displayName || null,
          createdAt:
            initialData.id && initialData.createdAt
              ? initialData.createdAt
              : Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        // Type-specific data
        if (type === "sell") {
          itemData.price = parseFloat(formData.price);
        } else {
          // type === "lostfound"
          itemData.lastSeenLocation = formData.lastSeenLocation.trim();
          itemData.dateFound = formData.dateFound
            ? Timestamp.fromDate(new Date(formData.dateFound))
            : null;
          // Set status based on whether dateFound is provided, or initialData.status if new
          // For editing, status might change if dateFound is added/removed
          itemData.status = itemData.dateFound ? "found" : "lost";

          // If it's a new item and initialData.status was explicitly 'found', ensure status is 'found'
          // This handles cases where user might not pick a date instantly but form intended as 'found'
          if (
            !isEditMode &&
            initialData.status === "found" &&
            !itemData.dateFound
          ) {
            // Forcing status to 'found' if it was intended, even if date not picked.
            // Consider making dateFound required for 'found' items in validation
            itemData.status = "found";
          }
          // isResolved field removed
        }

        // Submit the form
        await onSubmit(itemData);

        // Reset form if it was a new item
        if (!initialData.id) {
          setFormData({
            name: "",
            description: "",
            price: "",
            category: "",
            lastSeenLocation: "",
            dateFound: "",
            whatsappNumber: "",
          });
          setImageFiles([]);
          setImagePreviews([]);
          setExistingImageUrls([]);
        }
      } catch (submitError) {
        console.error("Form submission error:", submitError);
        setError(`Submission failed: ${submitError.message}`);
      } finally {
        setIsSubmitting(false);
        onFormProcessing?.(false);
      }
    },
    [
      formData,
      type,
      imagePreviews.length,
      existingImageUrls,
      imageFiles,
      validateForm,
      onSubmit,
      onFormProcessing,
      initialData.id,
      initialData.createdAt,
      initialData.status, // Add initialData.status to dependency array
      isEditMode,
    ]
  );

  // Dynamic labels and placeholders for Lost & Found fields
  const lfLocationLabel =
    initialData.status === "found" ? "Where Found *" : "Last Seen Location *";
  const lfLocationPlaceholder =
    initialData.status === "found"
      ? "Where was the item found?"
      : "Where was it last seen?";
  const lfDateLabel =
    initialData.status === "found" ? "Date Found" : "Date Lost";
  const lfDateHelperText =
    initialData.status === "found"
      ? "Date when the item was found"
      : "Date when the item was lost";

  if (isSubmitting) {
    return <LoadingSpinner message="Saving item..." />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-1">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800">Basic Information</h4>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            required
            placeholder="Enter item name"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            required
            rows="4"
            placeholder="Describe the item in detail"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange("category", e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Type-specific fields */}
      {type === "sell" ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (€) *
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => handleInputChange("price", e.target.value)}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">
            {initialData.status === "found"
              ? "Found Item Details"
              : "Lost Item Details"}
          </h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lfLocationLabel}
            </label>
            <input
              type="text"
              value={formData.lastSeenLocation}
              onChange={(e) =>
                handleInputChange("lastSeenLocation", e.target.value)
              }
              required // Making location required for both lost/found
              placeholder={lfLocationPlaceholder}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {lfDateLabel}
            </label>
            <input
              type="date"
              value={formData.dateFound}
              onChange={(e) => handleInputChange("dateFound", e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">{lfDateHelperText}</p>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          WhatsApp Number *
        </label>
        <input
          type="tel"
          value={formData.whatsappNumber}
          onChange={(e) => handleInputChange("whatsappNumber", e.target.value)}
          placeholder="+1234567890"
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Include country code (e.g., +1 for US, +44 for UK)
        </p>
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Images (Max {LIMITS.MAX_IMAGES}) *
        </label>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          disabled={imagePreviews.length >= LIMITS.MAX_IMAGES}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 disabled:opacity-50"
        />

        <p className="text-xs text-gray-500 mt-1">
          {imagePreviews.length === 0
            ? "At least one image is required"
            : `${
                LIMITS.MAX_IMAGES - imagePreviews.length
              } more images can be added`}
        </p>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {imagePreviews.map((previewUrl, index) => (
              <div key={`${previewUrl}-${index}`} className="relative group">
                <img
                  src={previewUrl}
                  alt={`Preview ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-lg shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <XCircleIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || imagePreviews.length === 0}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {isSubmitting
          ? isEditMode
            ? "Updating..."
            : "Adding..."
          : isEditMode
          ? "Update Item"
          : type === "sell"
          ? "Add Item for Sale"
          : initialData.status === "found"
          ? "Post Found Item"
          : "Post Lost Item"}
      </button>
    </form>
  );
};

export default React.memo(ItemForm);
