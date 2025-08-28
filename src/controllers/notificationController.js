const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const l = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (p - 1) * l;

    const [items, total] = await Promise.all([
      Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(l),
      Notification.countDocuments({ user: req.user._id }),
    ]);

    return res.json({ total, page: p, limit: l, items });
  } catch (err) {
    console.error('Get my notifications error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findOne({ _id: id, user: req.user._id });
    if (!notif) return res.status(404).json({ message: 'Notification not found' });

    notif.read = true;
    notif.readAt = new Date();
    await notif.save();

    return res.json({ message: 'Notification marked as read', notification: notif });
  } catch (err) {
    if (err?.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid notification id' });
    }
    console.error('Mark notification as read error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};