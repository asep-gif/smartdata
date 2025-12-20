const hotelAccessMiddleware = (req, res, next) => {
    const userRole = req.user?.role;
    const accessibleHotelIds = req.user?.accessible_hotel_ids || [];

    // Allow admin and manager roles full access without hotel_id restriction
    // This assumes 'manager' can also see all hotels, adjust if not.
    // The `database.sql` suggests 'manager' has broad permissions.
    if (userRole === 'admin') {
        return next();
    }

    // Extract hotel_id from request body or query parameters
    const requestedHotelId = parseInt(req.body.hotel_id || req.query.hotel_id, 10);

    // If no specific hotel_id is requested or if the user is a manager (and not admin),
    // and manager is not restricted by hotel, then allow
    // If manager role is supposed to be restricted by accessibleHotelIds,
    // then remove this check. For now, assuming manager has broader access.
    if (userRole === 'manager' && !requestedHotelId) {
        return next();
    }
    
    // For roles like 'staff', 'night_audit', etc., hotel_id is mandatory
    if (!requestedHotelId) {
        return res.status(400).json({ message: 'Hotel ID is required for this action.' });
    }

    // Check if the requested hotel_id is in the user's accessible_hotel_ids
    if (accessibleHotelIds.includes(requestedHotelId)) {
        // Attach the validated hotel_id to req.user for consistency and later use if needed
        req.user.current_hotel_id = requestedHotelId;
        return next();
    }

    return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki akses ke hotel ini.' });
};

module.exports = hotelAccessMiddleware;