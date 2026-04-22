import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Models
import User from "../models/User.model.js";
import Teacher from "../models/Teacher.model.js";
import Student from "../models/Student.model.js";
import Enrollment from "../models/Enrollment.model.js";
import Class from "../models/Class.model.js";
import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase() {
    try {
        const URI = process.env.MONGO_URI;
        if (!URI) {
            console.error("MONGO_URI is missing.");
            process.exit(1);
        }

        console.log("⏳ Connecting to Database...");
        await mongoose.connect(URI);
        console.log("✅ connected to DB!");

        console.log("🗑️  Dropping database...");
        await mongoose.connection.db.dropDatabase();
        console.log("✅ Database dropped!");

        const logins = [
            "=========================================",
            "🔑 MERIT NOOK COMPLETE PLATFORM LOGINS 🔑",
            "=========================================\n",
            "🌐 Admin Login:",
            "Email: admin@meritnook.com",
            "Password: password123\n",
        ];

        // 1. Admin
        await User.create({
            name: "Super Admin",
            email: "admin@meritnook.com",
            password: "password123",
            role: "admin",
            isVerified: true,
            isActive: true,
        });
        console.log("✅ Admin created!");

        // 2. Teacher
        const teacherUser = new User({
            name: "Ms. Sarah Carter",
            email: "teacher@meritnook.com",
            password: "password123",
            role: "teacher",
            isVerified: true,
            isActive: true,
        });
        await teacherUser.save();
        logins.push("📖 Teacher Login:");
        logins.push( "Email: teacher@meritnook.com");
        logins.push( "Password: password123\n");

        const teacherProfile = await Teacher.create({
            userId: teacherUser._id,
            teacherId: "TCH-001",
            subjects: ["Mathematics", "Physics", "Chemistry", "Computer Science"],
            experience: 8,
            bio: "Expert Mathematics and Physics tutor with 8 years of experience. I specialize in teaching complex concepts effortlessly.",
            rating: 4.8,
            totalStudents: 1,
            totalReviews: 24,
            badge: "Expert",
            grades: "6-12",
            salary: 50000,
            plans: [
                { name: "Monthly Intensive", price: 2500, features: ["8 Live Classes", "Weekly Mock Tests", "24/7 Email Support"] },
                { name: "Crash Course", price: 1500, features: ["4 Live Classes", "One Mock Test"] },
            ],
            availability: [
                { day: "Monday", slots: [{ start: "10:00 AM", end: "11:00 AM" }, { start: "04:00 PM", end: "06:00 PM" }] },
                { day: "Wednesday", slots: [{ start: "04:00 PM", end: "06:00 PM" }] },
                { day: "Friday", slots: [{ start: "04:00 PM", end: "06:00 PM" }] }
            ],
            languages: ["English", "Spanish"]
        });
        console.log("✅ Teacher created!");

        // 3. Student
        const studentUser = new User({
            name: "Alex Johnson",
            email: "student@meritnook.com",
            password: "password123",
            role: "student",
            isVerified: true,
            isActive: true,
        });
        await studentUser.save();
        logins.push("🎓 Student Login:");
        logins.push( "Email: student@meritnook.com");
        logins.push( "Password: password123\n");

        const studentProfile = await Student.create({
            userId: studentUser._id,
            studentId: "STU-001",
            grade: "10th",
            section: "A",
            parentName: "Mr. Robert Johnson",
            parentPhone: "9876543210",
            feeStatus: "paid"
        });
        console.log("✅ Student created!");

        // 4. Enrollment (Student enrolled to Teacher)
        const enrollment = await Enrollment.create({
            studentId: studentProfile._id,
            tutorId: teacherProfile._id,
            price: 2500,
            startDate: new Date(),
            endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
            status: "active",
            grade: "10th",
            board: "CBSE",
            school: "St. Xavier's High School",
            subjectsEnrolled: ["Mathematics", "Physics"],
            parentName: "Mr. Robert Johnson",
            parentPhone: "9876543210",
            preferredDays: ["Monday", "Wednesday", "Friday"],
            notes: "Needs extra attention in algebra.",
            nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
        });
        
        await Student.findByIdAndUpdate(studentProfile._id, { $push: { enrolledTutors: enrollment._id } });
        console.log("✅ Enrollment created!");

        // 5. Classes
        const pastClassStr = new Date();
        pastClassStr.setDate(pastClassStr.getDate() - 2);
        
        const upcomingClassStr = new Date();
        upcomingClassStr.setDate(upcomingClassStr.getDate() + 2);

        await Class.create({
            tutorId: teacherProfile._id,
            studentIds: [studentProfile._id],
            subject: "Mathematics",
            topic: "Trigonometry Basics",
            date: pastClassStr,
            timeSlot: { start: pastClassStr, end: new Date(pastClassStr.getTime() + 60*60*1000) },
            meetingLink: "https://zoom.us/j/123456789",
            status: "completed",
            topicsCovered: "Sine, Cosine and Tangent ratios.",
            classNotes: "Alex grasped the concepts quickly."
        });

        const upcomingClass = await Class.create({
            tutorId: teacherProfile._id,
            studentIds: [studentProfile._id],
            subject: "Physics",
            topic: "Laws of Motion",
            date: upcomingClassStr,
            timeSlot: { start: upcomingClassStr, end: new Date(upcomingClassStr.getTime() + 60*60*1000) },
            meetingLink: "https://zoom.us/j/987654321",
            status: "scheduled"
        });
        console.log("✅ Classes created!");

        // 6. Assignment
        const assignmentDate = new Date();
        assignmentDate.setDate(assignmentDate.getDate() + 5);

        const assignment = await Assignment.create({
            classId: upcomingClass._id,
            teacherId: teacherProfile._id,
            studentIds: [studentProfile._id],
            title: "Physics Problem Set 1",
            description: "Solve questions 1 through 15 from Chapter 3.",
            dueDate: assignmentDate,
            maxPoints: 20,
            priority: "high"
        });
        console.log("✅ Assignment created!");

        // 7. Submission
        await Submission.create({
            assignmentId: assignment._id,
            studentId: studentProfile._id,
            fileUrl: "https://example.com/homework.pdf",
            note: "Here is my homework. Question 14 was a bit tricky.",
            status: "submitted",
            submittedAt: new Date()
        });
        console.log("✅ Submission created!");

        // Save logins to file
        const filepath = path.resolve(__dirname, "../../../logins.txt");
        fs.writeFileSync(filepath, logins.join("\n"));
        console.log(`\n🎉 SEEDING COMPLETE! Logins saved to: ${filepath}`);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ ERROR SEEDING DB:", error);
        process.exit(1);
    }
}

seedDatabase();
