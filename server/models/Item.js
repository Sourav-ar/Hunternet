import mongoose from 'mongoose';

export const ITEM_CATEGORIES = [
  'Weapon',
  'Armor',
  'Accessory',
  'Mana Crystal',
  'Artifact',
];

export const ITEM_GRADES = [
  'E',
  'D',
  'C',
  'B',
  'A',
  'S',
  'National',
];

export const ITEM_STATUSES = [
  'Pending',
  'Analyzed',
  'Approved',
  'Auctioned',
  'Sold',
];

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: {
        values: ITEM_CATEGORIES,
        message: '{VALUE} is not a valid item category',
      },
      required: true,
    },
    grade: {
      type: String,
      enum: {
        values: ITEM_GRADES,
        message: '{VALUE} is not a valid item grade',
      },
      required: true,
      default: 'E',
    },
    description: {
      type: String,
      required: [true, 'Item description is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    guild: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guild',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ITEM_STATUSES,
        message: '{VALUE} is not a valid item status',
      },
      default: 'Pending',
    },
    estimatedValue: {
      type: Number,
      default: 0,
      min: 0,
      description: 'Estimated market value in Guild Tokens',
    },
    imageUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300',
    },
  },
  {
    timestamps: true,
  }
);

const Item = mongoose.model('Item', itemSchema);

export default Item;
