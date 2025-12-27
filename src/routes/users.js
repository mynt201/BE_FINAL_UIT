const express = require('express');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadAvatar
} = require('../controllers/users');
const { protect, authorize } = require('../middleware/auth');
const {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  paginationSchema,
  validate
} = require('../validators/users');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Routes with Zod validation
router.route('/')
  .get(validate(paginationSchema), getUsers)
  .post(authorize('admin'), validate(createUserSchema), createUser);

router.route('/:id')
  .get(validate(userIdSchema), getUser)
  .put(
    authorize('admin'),
    validate(updateUserSchema),
    updateUser
  )
  .delete(
    authorize('admin'),
    validate(userIdSchema),
    deleteUser
  );

// Avatar upload route
router.post('/:id/avatar',
  validate(userIdSchema),
  upload.single('avatar'),
  uploadAvatar
);

module.exports = router;
