import { Pool } from 'pg';
import { ApiError } from '../../utils/apiError';

export class VolunteerVoterSurveyService {
  /**
   * Get voters scoped strictly to volunteer's assigned booth IDs
   */
  static async getScopedVoters(
    tenantPool: Pool,
    assignedBoothIds: string[],
    limit = 50,
    offset = 0
  ): Promise<{ voters: any[]; total: number }> {
    if (!assignedBoothIds || assignedBoothIds.length === 0) {
      return { voters: [], total: 0 };
    }

    const countRes = await tenantPool.query(
      `SELECT COUNT(*)::int AS total FROM voters WHERE booth_id = ANY($1)`,
      [assignedBoothIds]
    );
    const total = countRes.rows[0]?.total || 0;

    const dataRes = await tenantPool.query(
      `SELECT * FROM voters WHERE booth_id = ANY($1) ORDER BY voter_name_eng ASC LIMIT $2 OFFSET $3`,
      [assignedBoothIds, limit, offset]
    );

    return { voters: dataRes.rows, total };
  }

  /**
   * Update voter survey status, ensuring voter belongs to an assigned booth
   */
  static async updateVoterSurvey(
    tenantPool: Pool,
    assignedBoothIds: string[],
    voterId: string,
    surveyData: { voterType?: string; isDead?: boolean; mobileNo?: string; notes?: string }
  ): Promise<any> {
    // Security check: ensure voter is in volunteer's assigned booth
    const checkRes = await tenantPool.query(
      `SELECT booth_id FROM voters WHERE id = $1`,
      [voterId]
    );

    if (checkRes.rowCount === 0) {
      throw ApiError.notFound('Voter record not found');
    }

    const voterBoothId = checkRes.rows[0].booth_id;
    if (!assignedBoothIds.includes(voterBoothId)) {
      throw ApiError.forbidden('Access denied: Voter is outside your assigned polling booths');
    }

    const updateRes = await tenantPool.query(
      `UPDATE voters
       SET voter_type = COALESCE($1, voter_type),
           is_dead = COALESCE($2, is_dead),
           mobile_no = COALESCE($3, mobile_no),
           notes = COALESCE($4, notes),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        surveyData.voterType || null,
        surveyData.isDead !== undefined ? surveyData.isDead : null,
        surveyData.mobileNo || null,
        surveyData.notes || null,
        voterId,
      ]
    );

    return updateRes.rows[0];
  }
}
