const User = require('../models/User');
const Staff = require('../models/Staff');

// Get all staff members (Admin)
exports.getAllStaff = async (req, res) => {
    try {
        const staff = await Staff.find().populate('userId', 'name email phone profileImage');

        // Flatten the data for easier use on frontend
        const flattenedStaff = staff.map(s => {
            if (!s.userId) return null;
            const user = s.userId.toObject ? s.userId.toObject() : s.userId;
            const staffObj = s.toObject ? s.toObject() : s;
            return {
                ...staffObj,
                ...user,
                _id: staffObj._id, // Keep the staff record ID
                userId: user._id    // Keep the reference for user operations
            };
        }).filter(Boolean);

        res.status(200).json({
            success: true,
            count: flattenedStaff.length,
            data: flattenedStaff
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create new staff member (Admin)
// This creates a User with role 'staff' AND a Staff record
exports.createStaff = async (req, res) => {
    try {
        const { name, email, phone, role, salary, shift, joiningDate, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
            // If user exists, check if they already have a staff profile
            const existingStaff = await Staff.findOne({ userId: user._id });
            if (existingStaff) {
                return res.status(400).json({ success: false, message: 'Staff profile already exists for this email' });
            }

            // Only change role to 'staff' if current role is 'user'
            // This prevents downgrading an 'admin' to 'staff'
            if (user.role === 'user') {
                user.role = 'staff';
                if (phone) user.phone = phone;
                await user.save();
            } else if (phone && user.phone !== phone) {
                user.phone = phone;
                await user.save();
            }
        } else {
            // Create brand new user
            user = await User.create({
                name,
                email,
                phone,
                password: password || 'Staff@123', // Default password if none provided
                role: 'staff'
            });
        }

        // Create staff profile
        const staff = await Staff.create({
            userId: user._id,
            role: role || 'staff',
            salary,
            shift,
            joiningDate
        });

        res.status(201).json({
            success: true,
            message: 'Staff member added successfully',
            data: staff
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update staff member (Admin)
exports.updateStaff = async (req, res) => {
    try {
        const { name, email, phone, role, salary, shift, joiningDate, isActive } = req.body;

        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff profile not found' });
        }

        // Update Staff details
        staff.role = role || staff.role;
        staff.salary = salary !== undefined ? salary : staff.salary;
        staff.shift = shift || staff.shift;
        staff.joiningDate = joiningDate || staff.joiningDate;
        staff.isActive = isActive !== undefined ? isActive : staff.isActive;
        await staff.save();

        // Update User details
        if (staff.userId) {
            const user = await User.findById(staff.userId);
            if (user) {
                user.name = name || user.name;
                user.email = email || user.email;
                user.phone = phone || user.phone;
                await user.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Staff member updated successfully',
            data: staff
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete staff member (Admin)
// This deletes the staff record and REVERTS the user role to 'user' OR deletes the user?
// Usually, we just delete the employment record.
exports.deleteStaff = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff member not found' });
        }

        // Optional: Revert user role back to 'user'
        if (staff.userId) {
            await User.findByIdAndUpdate(staff.userId, { role: 'user' });
        }

        await Staff.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Staff record deleted. User role reverted to default.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
