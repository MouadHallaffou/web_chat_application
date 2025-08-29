"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const profile_controller_1 = require("../controllers/profile.controller");
const auth_1 = require("../middlewares/auth");
const router = express_1.default.Router();
// Protected routes
router.put('/edit', auth_1.authenticate, profile_controller_1.updateProfile);
router.delete('/delete', auth_1.authenticate, profile_controller_1.deleteAccount);
exports.default = router;
