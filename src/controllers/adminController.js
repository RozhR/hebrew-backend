import pool from "../db.js";

export async function getAdminAnalytics(request, response) {
    try {
        const [
            summaryResult,
            registrationsResult,
            testActivityResult,
            categoriesResult,
            levelsResult,
        ] = await Promise.all([
            pool.query(`
                WITH all_tests AS (
                    SELECT user_id, percent, attempted_at
                    FROM app.test_statistics

                    UNION ALL

                    SELECT user_id, percent, attempted_at
                    FROM app.grammar_test_statistics
                )
                SELECT
                    (SELECT COUNT(*)::int
                     FROM app.users) AS total_users,

                    (SELECT COUNT(*)::int
                     FROM app.users
                     WHERE created_at >= NOW() - INTERVAL '7 days')
                        AS new_users_7d,

                    (SELECT COUNT(*)::int
                     FROM app.users
                     WHERE created_at >= NOW() - INTERVAL '30 days')
                        AS new_users_30d,

                    (SELECT COUNT(DISTINCT user_id)::int
                     FROM all_tests
                     WHERE attempted_at >= NOW() - INTERVAL '7 days')
                        AS active_users_7d,

                    (SELECT COUNT(DISTINCT user_id)::int
                     FROM all_tests
                     WHERE attempted_at >= NOW() - INTERVAL '30 days')
                        AS active_users_30d,

                    (SELECT COUNT(*)::int
                     FROM app.test_statistics) AS total_tests,

                    (SELECT COUNT(*)::int
                     FROM app.grammar_test_statistics)
                        AS total_grammar_tests,

                    (SELECT COUNT(*)::int
                     FROM all_tests
                     WHERE attempted_at >= CURRENT_DATE)
                        AS tests_today,

                    (SELECT ROUND(AVG(percent), 1)
                     FROM all_tests) AS average_score
            `),

            pool.query(`
                SELECT
                    dates.day::date::text AS date,
                    COUNT(users.id)::int AS count
                FROM generate_series(
                    CURRENT_DATE - INTERVAL '29 days',
                    CURRENT_DATE,
                    INTERVAL '1 day'
                ) AS dates(day)
                LEFT JOIN app.users AS users
                    ON users.created_at >= dates.day
                    AND users.created_at < dates.day + INTERVAL '1 day'
                GROUP BY dates.day
                ORDER BY dates.day
            `),

            pool.query(`
                WITH all_tests AS (
                    SELECT attempted_at
                    FROM app.test_statistics

                    UNION ALL

                    SELECT attempted_at
                    FROM app.grammar_test_statistics
                )
                SELECT
                    dates.day::date::text AS date,
                    COUNT(tests.attempted_at)::int AS count
                FROM generate_series(
                    CURRENT_DATE - INTERVAL '29 days',
                    CURRENT_DATE,
                    INTERVAL '1 day'
                ) AS dates(day)
                LEFT JOIN all_tests AS tests
                    ON tests.attempted_at >= dates.day
                    AND tests.attempted_at < dates.day + INTERVAL '1 day'
                GROUP BY dates.day
                ORDER BY dates.day
            `),

            pool.query(`
                SELECT
                    category,
                    COUNT(*)::int AS total_tests,
                    ROUND(AVG(percent), 1) AS average_score
                FROM app.test_statistics
                GROUP BY category
                ORDER BY category
            `),

            pool.query(`
                SELECT
                    category,
                    unlocked_level AS level,
                    COUNT(*)::int AS users
                FROM app.user_progress
                GROUP BY category, unlocked_level
                ORDER BY category, unlocked_level
            `),
        ]);

        return response.status(200).json({
            data: {
                ...summaryResult.rows[0],
                registrations: registrationsResult.rows,
                test_activity: testActivityResult.rows,
                categories: categoriesResult.rows,
                levels: levelsResult.rows,
            },
        });
    } catch (error) {
        console.error("Admin analytics error:", error);

        return response.status(500).json({
            message: "Failed to load admin analytics",
        });
    }
}
