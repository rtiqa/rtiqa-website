import { db } from '../../db.ts';
import type { User, OrganizationMembership, AIDocumentChunk } from '../../types.ts';
import { CurriculumResolver } from '../../curriculumResolver.ts';

export class RAGAuthZ {
  public static canAccessChunk(activeUser: User, activeMembership: OrganizationMembership, chunk: AIDocumentChunk): boolean {
    const orgId = activeMembership.organizationId;
    const role = activeMembership.role;

    // 1. Tenant Isolation
    if (chunk.organizationId !== orgId && chunk.organizationId !== 'platform') {
      return false;
    }

    // AI Conversations (Private Data)
    if (chunk.sourceType === 'AI_CONVERSATION') {
      if (!chunk.userId || chunk.userId !== activeUser.id) {
        return false;
      }
    }

    // 2. Global Content Handling & Overrides
    if (chunk.organizationId === 'platform') {
      // If it's a global lesson, verify it hasn't been overridden by this tenant using CurriculumResolver
      if (chunk.sourceType === 'LESSON' && chunk.sourceId) {
        const localCourses = db.getCourses(orgId);
        let hasOverride = false;
        for (const course of localCourses) {
          try {
            const resolvedHierarchy = CurriculumResolver.getResolvedCourseHierarchy(course.id, orgId);
            for (const unit of resolvedHierarchy.units) {
              for (const lesson of unit.lessons) {
                if (lesson.globalReferenceId === chunk.sourceId && lesson.organizationId === orgId) {
                  hasOverride = true;
                  break;
                }
              }
              if (hasOverride) break;
            }
          } catch {
            // fallback if course resolution fails
          }
          if (hasOverride) break;
        }
        if (hasOverride) {
          return false; // The AI uses the local override chunk instead, exactly matching CurriculumResolver
        }
      }
      
      // Basic visibility checks for global library resources
      if (chunk.sourceType === 'LIBRARY_RESOURCE' && chunk.sourceId) {
        const lr = db.getLibraryResourceById(chunk.sourceId, 'platform');
        if (!lr) return false;
        
        if (lr.status !== 'PUBLISHED') return false;
        if (role === 'STUDENT' && (lr.visibility === 'PRIVATE' || lr.visibility === 'TEACHERS_ONLY')) return false;
        if (role === 'PARENT' && (lr.visibility === 'PRIVATE' || lr.visibility === 'TEACHERS_ONLY')) return false;
      }
    } else {
      // Local Tenant Content Checks
      if (chunk.sourceType === 'LESSON' && chunk.sourceId) {
        const lesson = db.getLessonById(chunk.sourceId, orgId);
        if (!lesson) return false;
        if (!lesson.isPublished && role === 'STUDENT') return false;
      }
      
      if (chunk.sourceType === 'LIBRARY_RESOURCE' && chunk.sourceId) {
        const lr = db.getLibraryResourceById(chunk.sourceId, orgId);
        if (!lr) return false;
        
        if (lr.status !== 'PUBLISHED' && role !== 'TEACHER' && role !== 'ORG_ADMIN') return false;
        if (role === 'STUDENT' && (lr.visibility === 'PRIVATE' || lr.visibility === 'TEACHERS_ONLY')) return false;
        if (role === 'PARENT' && (lr.visibility === 'PRIVATE' || lr.visibility === 'TEACHERS_ONLY')) return false;
      }
    }

    // Source Visibility checks embedded in the chunk
    if (chunk.sourceVisibility === 'PRIVATE' && role !== 'TEACHER' && role !== 'ORG_ADMIN') {
      return false;
    }
    if (chunk.sourceVisibility === 'TEACHERS_ONLY' && (role === 'STUDENT' || role === 'PARENT')) {
      return false;
    }

    return true;
  }
}
