import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AdminService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getStats() {
    const [
      applicationStats,
      applicationsByOrg,
      userStats,
      eventStats,
      topRoles,
      topSkills,
      topOrganizations,
      marketplaceStats,
      volunteeringStats,
      reviewStats,
      recentActivity,
      monthlyApplicationTrend,
    ] = await Promise.all([
      this.getApplicationStats(),
      this.getApplicationsByOrganization(),
      this.getUserStats(),
      this.getEventStats(),
      this.getTopRoles(),
      this.getTopSkills(),
      this.getTopOrganizations(),
      this.getMarketplaceStats(),
      this.getVolunteeringStats(),
      this.getReviewStats(),
      this.getRecentActivity(),
      this.getMonthlyApplicationTrend(),
    ]);

    return {
      applications: {
        ...applicationStats,
        byOrganization: applicationsByOrg,
        monthlyTrend: monthlyApplicationTrend,
      },
      users: userStats,
      events: {
        ...eventStats,
        topRoles,
        topSkills,
        topOrganizations,
      },
      marketplace: marketplaceStats,
      volunteering: volunteeringStats,
      reviews: reviewStats,
      recentActivity,
    };
  }

  private async getApplicationStats() {
    const result = await this.dataSource.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
        COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected,
        COUNT(*) FILTER (WHERE status = 'PENDING') AS pending,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
        ROUND(
          COUNT(*) FILTER (WHERE status = 'APPROVED')::numeric /
          NULLIF(COUNT(*) FILTER (WHERE status IN ('APPROVED','REJECTED')), 0) * 100, 1
        ) AS approval_rate,
        ROUND(
          COUNT(*) FILTER (WHERE status = 'REJECTED')::numeric /
          NULLIF(COUNT(*) FILTER (WHERE status IN ('APPROVED','REJECTED')), 0) * 100, 1
        ) AS rejection_rate,
        ROUND(AVG(match_score) FILTER (WHERE match_score IS NOT NULL), 1) AS avg_match_score
      FROM applications
    `);
    const row = result[0];
    return {
      total: Number(row.total),
      approved: Number(row.approved),
      rejected: Number(row.rejected),
      pending: Number(row.pending),
      completed: Number(row.completed),
      approvalRate: Number(row.approval_rate) || 0,
      rejectionRate: Number(row.rejection_rate) || 0,
      avgMatchScore: Number(row.avg_match_score) || 0,
    };
  }

  private async getApplicationsByOrganization() {
    const result = await this.dataSource.query(`
      SELECT
        u.id AS org_id,
        COALESCE(u.company_name, u.display_name, u.email) AS org_name,
        COUNT(a.id) AS total,
        COUNT(a.id) FILTER (WHERE a.status = 'APPROVED') AS approved,
        COUNT(a.id) FILTER (WHERE a.status = 'REJECTED') AS rejected,
        COUNT(a.id) FILTER (WHERE a.status = 'PENDING') AS pending,
        ROUND(
          COUNT(a.id) FILTER (WHERE a.status = 'APPROVED')::numeric /
          NULLIF(COUNT(a.id) FILTER (WHERE a.status IN ('APPROVED','REJECTED')), 0) * 100, 1
        ) AS approval_rate
      FROM users u
      JOIN events e ON e.organizer_id = u.id
      JOIN event_roles er ON er.event_id = e.id
      JOIN applications a ON a.role_id = er.id
      WHERE u.role IN ('ORGANIZER', 'ADMIN')
      GROUP BY u.id, u.company_name, u.display_name, u.email
      ORDER BY total DESC
      LIMIT 10
    `);
    return result.map((r: Record<string, unknown>) => ({
      orgId: r.org_id,
      orgName: r.org_name,
      total: Number(r.total),
      approved: Number(r.approved),
      rejected: Number(r.rejected),
      pending: Number(r.pending),
      approvalRate: Number(r.approval_rate) || 0,
    }));
  }

  private async getUserStats() {
    const result = await this.dataSource.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE role = 'VOLUNTEER') AS volunteers,
        COUNT(*) FILTER (WHERE role = 'ORGANIZER') AS organizers,
        COUNT(*) FILTER (WHERE role = 'ADMIN') AS admins,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS new_this_month,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS new_this_week
      FROM users
    `);
    const row = result[0];
    return {
      total: Number(row.total),
      volunteers: Number(row.volunteers),
      organizers: Number(row.organizers),
      admins: Number(row.admins),
      newThisMonth: Number(row.new_this_month),
      newThisWeek: Number(row.new_this_week),
    };
  }

  private async getEventStats() {
    const result = await this.dataSource.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE end_date > NOW()) AS active,
        COUNT(*) FILTER (WHERE end_date <= NOW()) AS completed,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS created_this_month
      FROM events
    `);
    const row = result[0];
    return {
      total: Number(row.total),
      active: Number(row.active),
      completed: Number(row.completed),
      createdThisMonth: Number(row.created_this_month),
    };
  }

  private async getTopRoles() {
    const result = await this.dataSource.query(`
      SELECT
        er.role_name,
        COUNT(a.id) AS application_count,
        COUNT(a.id) FILTER (WHERE a.status = 'APPROVED') AS approved_count
      FROM event_roles er
      LEFT JOIN applications a ON a.role_id = er.id
      GROUP BY er.role_name
      ORDER BY application_count DESC
      LIMIT 10
    `);
    return result.map((r: Record<string, unknown>) => ({
      roleName: r.role_name,
      applicationCount: Number(r.application_count),
      approvedCount: Number(r.approved_count),
    }));
  }

  private async getTopSkills() {
    const result = await this.dataSource.query(`
      SELECT
        s.name AS skill_name,
        COUNT(DISTINCT er.id) AS used_in_roles,
        COUNT(DISTINCT e.id) AS used_in_events
      FROM skills s
      JOIN event_roles er ON s.id = ANY(er.required_skills)
      JOIN events e ON e.id = er.event_id
      GROUP BY s.name
      ORDER BY used_in_roles DESC
      LIMIT 10
    `);
    return result.map((r: Record<string, unknown>) => ({
      skillName: r.skill_name,
      usedInRoles: Number(r.used_in_roles),
      usedInEvents: Number(r.used_in_events),
    }));
  }

  private async getTopOrganizations() {
    const result = await this.dataSource.query(`
      SELECT
        u.id AS org_id,
        COALESCE(u.company_name, u.display_name, u.email) AS org_name,
        COUNT(DISTINCT e.id) AS events_count,
        COUNT(DISTINCT a.id) AS total_applications,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('APPROVED','COMPLETED')) AS accepted_volunteers
      FROM users u
      JOIN events e ON e.organizer_id = u.id
      LEFT JOIN event_roles er ON er.event_id = e.id
      LEFT JOIN applications a ON a.role_id = er.id
      WHERE u.role IN ('ORGANIZER', 'ADMIN')
      GROUP BY u.id, u.company_name, u.display_name, u.email
      ORDER BY total_applications DESC
      LIMIT 10
    `);
    return result.map((r: Record<string, unknown>) => ({
      orgId: r.org_id,
      orgName: r.org_name,
      eventsCount: Number(r.events_count),
      totalApplications: Number(r.total_applications),
      acceptedVolunteers: Number(r.accepted_volunteers),
    }));
  }

  private async getMarketplaceStats() {
    const topProducts = await this.dataSource.query(`
      SELECT
        mi.name,
        mi.point_cost,
        COUNT(pt.id) AS purchase_count,
        SUM(ABS(pt.amount)) AS total_points_spent
      FROM marketplace_items mi
      LEFT JOIN point_transactions pt ON pt.description ILIKE '%' || mi.name || '%'
        AND pt.amount < 0
      GROUP BY mi.id, mi.name, mi.point_cost
      ORDER BY purchase_count DESC
      LIMIT 10
    `);

    const totalsResult = await this.dataSource.query(`
      SELECT
        ABS(SUM(amount)) FILTER (WHERE amount < 0) AS total_points_spent,
        SUM(amount) FILTER (WHERE amount > 0) AS total_points_earned,
        COUNT(DISTINCT user_id) AS users_with_transactions
      FROM point_transactions
    `);

    const totals = totalsResult[0];
    return {
      topProducts: topProducts.map((r: Record<string, unknown>) => ({
        name: r.name,
        pointCost: Number(r.point_cost),
        purchaseCount: Number(r.purchase_count),
        totalPointsSpent: Number(r.total_points_spent) || 0,
      })),
      totalPointsSpent: Number(totals.total_points_spent) || 0,
      totalPointsEarned: Number(totals.total_points_earned) || 0,
      usersWithTransactions: Number(totals.users_with_transactions) || 0,
    };
  }

  private async getVolunteeringStats() {
    const topEvents = await this.dataSource.query(`
      SELECT
        e.title,
        e.id AS event_id,
        SUM(vl.points_earned) AS total_points_awarded,
        COUNT(DISTINCT vl.user_id) AS volunteer_count,
        ROUND(AVG(vl.hours_worked)::numeric, 1) AS avg_hours
      FROM events e
      JOIN volunteer_logs vl ON vl.event_id = e.id
      GROUP BY e.id, e.title
      ORDER BY total_points_awarded DESC
      LIMIT 10
    `);

    const overallResult = await this.dataSource.query(`
      SELECT
        COUNT(*) AS total_logs,
        SUM(points_earned) AS total_points,
        ROUND(SUM(hours_worked)::numeric, 0) AS total_hours,
        COUNT(DISTINCT user_id) AS unique_volunteers
      FROM volunteer_logs
    `);

    const overall = overallResult[0];
    return {
      topEventsByPoints: topEvents.map((r: Record<string, unknown>) => ({
        eventTitle: r.title,
        eventId: r.event_id,
        totalPointsAwarded: Number(r.total_points_awarded),
        volunteerCount: Number(r.volunteer_count),
        avgHours: Number(r.avg_hours),
      })),
      totalLogs: Number(overall.total_logs),
      totalPointsAwarded: Number(overall.total_points) || 0,
      totalHoursVolunteered: Number(overall.total_hours) || 0,
      uniqueVolunteers: Number(overall.unique_volunteers),
    };
  }

  private async getReviewStats() {
    const byOrg = await this.dataSource.query(`
      SELECT
        u.id AS org_id,
        COALESCE(u.company_name, u.display_name, u.email) AS org_name,
        ROUND(AVG(orv.rating)::numeric, 2) AS avg_rating,
        COUNT(orv.id) AS review_count
      FROM users u
      JOIN organization_reviews orv ON orv.organization_id = u.id
      GROUP BY u.id, u.company_name, u.display_name, u.email
      ORDER BY avg_rating DESC
      LIMIT 10
    `);

    const overallResult = await this.dataSource.query(`
      SELECT
        ROUND(AVG(rating)::numeric, 2) AS overall_avg,
        COUNT(*) AS total_reviews,
        COUNT(*) FILTER (WHERE rating = 5) AS five_star,
        COUNT(*) FILTER (WHERE rating >= 4) AS four_plus_star
      FROM organization_reviews
    `);

    const overall = overallResult[0];
    return {
      avgRatingByOrg: byOrg.map((r: Record<string, unknown>) => ({
        orgId: r.org_id,
        orgName: r.org_name,
        avgRating: Number(r.avg_rating),
        reviewCount: Number(r.review_count),
      })),
      overallAvgRating: Number(overall.overall_avg) || 0,
      totalReviews: Number(overall.total_reviews),
      fiveStarCount: Number(overall.five_star),
      fourPlusStarCount: Number(overall.four_plus_star),
    };
  }

  private async getRecentActivity() {
    const result = await this.dataSource.query(`
      (
        SELECT
          'application' AS type,
          'Aplicație ' || a.status AS description,
          COALESCE(u.display_name, u.email) AS actor,
          a.created_at AS timestamp
        FROM applications a
        JOIN users u ON u.id = a.user_id
        ORDER BY a.created_at DESC
        LIMIT 7
      )
      UNION ALL
      (
        SELECT
          'event' AS type,
          'Eveniment nou: ' || e.title AS description,
          COALESCE(u.display_name, u.company_name, u.email) AS actor,
          e.created_at AS timestamp
        FROM events e
        JOIN users u ON u.id = e.organizer_id
        ORDER BY e.created_at DESC
        LIMIT 7
      )
      UNION ALL
      (
        SELECT
          'review' AS type,
          'Recenzie ' || orv.rating || '★ adăugată' AS description,
          COALESCE(u.display_name, u.email) AS actor,
          orv.created_at AS timestamp
        FROM organization_reviews orv
        JOIN users u ON u.id = orv.reviewer_id
        ORDER BY orv.created_at DESC
        LIMIT 6
      )
      ORDER BY timestamp DESC
      LIMIT 20
    `);
    return result.map((r: Record<string, unknown>) => ({
      type: r.type,
      description: r.description,
      actor: r.actor,
      timestamp: r.timestamp,
    }));
  }

  private async getMonthlyApplicationTrend() {
    const result = await this.dataSource.query(`
      SELECT
        TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') AS month,
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
        COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected
      FROM applications
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY date_trunc('month', created_at)
      ORDER BY month ASC
    `);
    return result.map((r: Record<string, unknown>) => ({
      month: r.month,
      total: Number(r.total),
      approved: Number(r.approved),
      rejected: Number(r.rejected),
    }));
  }
}
