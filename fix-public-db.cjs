const fs = require('fs');
let code = fs.readFileSync('server/platform/db.ts', 'utf-8');

// 1. createAttendanceSession
code = code.replace(
  /  createAttendanceSession\(\n    data: Omit<AttendanceSession, 'id' \| 'createdAt' \| 'updatedAt'>\n  \): AttendanceSession \{([\s\S]*?)    this\.attendanceSessions\.set\(id, session\);\n    this\.persistAttendanceSessionToPostgres\(session\);\n    return session;\n  \}/g,
  `  async createAttendanceSession(
    data: Omit<AttendanceSession, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AttendanceSession> {$1    await this.persistAttendanceSessionToPostgres(session);
    this.attendanceSessions.set(id, session);
    return session;
  }`
);

// 2. updateAttendanceSession
code = code.replace(
  /  updateAttendanceSession\(\n    id: string,\n    organizationId: string,\n    updates: Partial<AttendanceSession>\n  \): AttendanceSession \| undefined \{([\s\S]*?)    this\.attendanceSessions\.set\(id, updated\);\n    this\.persistAttendanceSessionToPostgres\(updated\);\n    return updated;\n  \}/g,
  `  async updateAttendanceSession(
    id: string,
    organizationId: string,
    updates: Partial<AttendanceSession>
  ): Promise<AttendanceSession | undefined> {$1    await this.persistAttendanceSessionToPostgres(updated);
    this.attendanceSessions.set(id, updated);
    return updated;
  }`
);

// 3. deleteAttendanceSession
code = code.replace(
  /  deleteAttendanceSession\(id: string, organizationId: string\): boolean \{([\s\S]*?)    this\.attendanceSessions\.delete\(id\);\n    this\.deleteAttendanceSessionFromPostgres\(id, organizationId\);([\s\S]*?)    return true;\n  \}/g,
  `  async deleteAttendanceSession(id: string, organizationId: string): Promise<boolean> {$1    await this.deleteAttendanceSessionFromPostgres(id, organizationId);
    this.attendanceSessions.delete(id);$2    return true;
  }`
);

// 4. markAttendance (can update multiple, loop)
code = code.replace(
  /  markAttendance\(\n    sessionId: string,\n    organizationId: string,\n    records: \{\n      studentId: string;\n      status: 'PRESENT' \| 'ABSENT' \| 'LATE' \| 'EXCUSED';\n      notes\?: string;\n    \}\[\],\n    recordedBy: string\n  \): AttendanceRecord\[\] \{([\s\S]*?)        this\.attendanceRecords\.set\(entry\.id, entry\);\n        this\.persistAttendanceRecordToPostgres\(entry\);([\s\S]*?)        this\.attendanceSessions\.set\(activeSessionId, session\);\n        this\.persistAttendanceSessionToPostgres\(session\);([\s\S]*?)    return saved;\n  \}/g,
  `  async markAttendance(
    sessionId: string,
    organizationId: string,
    records: {
      studentId: string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
      notes?: string;
    }[],
    recordedBy: string
  ): Promise<AttendanceRecord[]> {$1        await this.persistAttendanceRecordToPostgres(entry);
        this.attendanceRecords.set(entry.id, entry);$2        await this.persistAttendanceSessionToPostgres(session);
        this.attendanceSessions.set(activeSessionId, session);$3    return saved;
  }`
);

// 5. updateAttendanceRecord
code = code.replace(
  /  updateAttendanceRecord\(\n    id: string,\n    organizationId: string,\n    updates: Partial<AttendanceRecord>\n  \): AttendanceRecord \| undefined \{([\s\S]*?)    this\.attendanceRecords\.set\(id, updated\);\n    this\.persistAttendanceRecordToPostgres\(updated\);\n    return updated;\n  \}/g,
  `  async updateAttendanceRecord(
    id: string,
    organizationId: string,
    updates: Partial<AttendanceRecord>
  ): Promise<AttendanceRecord | undefined> {$1    await this.persistAttendanceRecordToPostgres(updated);
    this.attendanceRecords.set(id, updated);
    return updated;
  }`
);

// 6. createAssessment
code = code.replace(
  /  createAssessment\(data: Omit<Assessment, 'id' \| 'createdAt' \| 'updatedAt'>\): Assessment \{([\s\S]*?)    this\.assessments\.set\(id, assessment\);\n    this\.persistAssessmentToPostgres\(assessment\);\n    return assessment;\n  \}/g,
  `  async createAssessment(data: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assessment> {$1    await this.persistAssessmentToPostgres(assessment);
    this.assessments.set(id, assessment);
    return assessment;
  }`
);

// 7. updateAssessment
code = code.replace(
  /  updateAssessment\(\n    id: string,\n    organizationId: string,\n    updates: Partial<Assessment>\n  \): Assessment \| undefined \{([\s\S]*?)    this\.assessments\.set\(id, updated\);\n    this\.persistAssessmentToPostgres\(updated\);\n    return updated;\n  \}/g,
  `  async updateAssessment(
    id: string,
    organizationId: string,
    updates: Partial<Assessment>
  ): Promise<Assessment | undefined> {$1    await this.persistAssessmentToPostgres(updated);
    this.assessments.set(id, updated);
    return updated;
  }`
);

// 8. deleteAssessment
code = code.replace(
  /  deleteAssessment\(id: string, organizationId: string\): boolean \{([\s\S]*?)    this\.assessments\.delete\(id\);\n    this\.deleteAssessmentFromPostgres\(id, organizationId\);([\s\S]*?)        this\.assessmentGrades\.delete\(gid\);\n        this\.deleteAssessmentGradeFromPostgres\(gid, organizationId\);([\s\S]*?)    return true;\n  \}/g,
  `  async deleteAssessment(id: string, organizationId: string): Promise<boolean> {$1    await this.deleteAssessmentFromPostgres(id, organizationId);
    this.assessments.delete(id);$2        await this.deleteAssessmentGradeFromPostgres(gid, organizationId);
        this.assessmentGrades.delete(gid);$3    return true;
  }`
);

// 9. gradeAssessment
code = code.replace(
  /  gradeAssessment\(\n    assessmentId: string,\n    studentId: string,\n    organizationId: string,\n    score: number,\n    gradedBy: string,\n    feedback\?: string\n  \): AssessmentGrade \| undefined \{([\s\S]*?)      this\.assessmentGrades\.set\(existing\.id, updated\);\n      this\.persistAssessmentGradeToPostgres\(updated\);\n      return updated;([\s\S]*?)    this\.assessmentGrades\.set\(id, grade\);\n    this\.persistAssessmentGradeToPostgres\(grade\);\n    return grade;\n  \}/g,
  `  async gradeAssessment(
    assessmentId: string,
    studentId: string,
    organizationId: string,
    score: number,
    gradedBy: string,
    feedback?: string
  ): Promise<AssessmentGrade | undefined> {$1      await this.persistAssessmentGradeToPostgres(updated);
      this.assessmentGrades.set(existing.id, updated);
      return updated;$2    await this.persistAssessmentGradeToPostgres(grade);
    this.assessmentGrades.set(id, grade);
    return grade;
  }`
);

// 10. deleteAssessmentGrade
code = code.replace(
  /  deleteAssessmentGrade\(id: string, organizationId: string\): boolean \{([\s\S]*?)    this\.assessmentGrades\.delete\(id\);\n    this\.deleteAssessmentGradeFromPostgres\(id, organizationId\);\n    return true;\n  \}/g,
  `  async deleteAssessmentGrade(id: string, organizationId: string): Promise<boolean> {$1    await this.deleteAssessmentGradeFromPostgres(id, organizationId);
    this.assessmentGrades.delete(id);
    return true;
  }`
);

// 11. createStorageObject
code = code.replace(
  /  createStorageObject\(\n    data: Omit<StorageObjectMetadata, 'id' \| 'createdAt' \| 'updatedAt' \| 'deletedAt'>\n  \): StorageObjectMetadata \{([\s\S]*?)    this\.storageObjects\.set\(id, obj\);\n    this\.persistStorageObjectToPostgres\(obj\);\n    return obj;\n  \}/g,
  `  async createStorageObject(
    data: Omit<StorageObjectMetadata, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>
  ): Promise<StorageObjectMetadata> {$1    await this.persistStorageObjectToPostgres(obj);
    this.storageObjects.set(id, obj);
    return obj;
  }`
);

// 12. updateStorageObject
code = code.replace(
  /  updateStorageObject\(\n    id: string,\n    organizationId: string,\n    updates: Partial<StorageObjectMetadata>\n  \): StorageObjectMetadata \| undefined \{([\s\S]*?)    this\.storageObjects\.set\(id, updated\);\n    this\.persistStorageObjectToPostgres\(updated\);\n    return updated;\n  \}/g,
  `  async updateStorageObject(
    id: string,
    organizationId: string,
    updates: Partial<StorageObjectMetadata>
  ): Promise<StorageObjectMetadata | undefined> {$1    await this.persistStorageObjectToPostgres(updated);
    this.storageObjects.set(id, updated);
    return updated;
  }`
);

// 13. deleteStorageObject
code = code.replace(
  /  deleteStorageObject\(id: string, organizationId: string, hardDelete = false\): boolean \{([\s\S]*?)      this\.storageObjects\.delete\(id\);\n      this\.deleteStorageObjectFromPostgres\(id, organizationId, true\);([\s\S]*?)      this\.storageObjects\.set\(id, updated\);\n      this\.persistStorageObjectToPostgres\(updated\);([\s\S]*?)    return true;\n  \}/g,
  `  async deleteStorageObject(id: string, organizationId: string, hardDelete = false): Promise<boolean> {$1      await this.deleteStorageObjectFromPostgres(id, organizationId, true);
      this.storageObjects.delete(id);$2      await this.persistStorageObjectToPostgres(updated);
      this.storageObjects.set(id, updated);$3    return true;
  }`
);

fs.writeFileSync('server/platform/db.ts', code);
console.log('Modified public methods');
