"""
Панель модератора: просмотр всех отзывов, одобрение, отклонение и удаление.
"""
import json
import os
import psycopg2


MODERATOR_KEY = os.environ.get('MODERATOR_KEY', 'spacework-admin-2024')


def get_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def check_auth(event: dict) -> bool:
    headers = event.get('headers') or {}
    key = headers.get('X-Moderator-Key') or headers.get('x-moderator-key') or ''
    return key == MODERATOR_KEY


def handler(event: dict, context) -> dict:
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Moderator-Key',
        'Content-Type': 'application/json'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    if not check_auth(event):
        return {
            'statusCode': 401,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Неверный ключ доступа'}, ensure_ascii=False)
        }

    method = event.get('httpMethod', 'GET')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')
    path = event.get('path', '/')
    parts = [p for p in path.split('/') if p]

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        status_filter = params.get('status', 'all')
        page = int(params.get('page', 1))
        limit = int(params.get('limit', 20))
        offset = (page - 1) * limit

        where = ''
        if status_filter != 'all':
            where = f"WHERE status = '{status_filter}'"

        conn = get_connection()
        cur = conn.cursor()

        cur.execute(f"SELECT COUNT(*) FROM {schema}.reviews {where}")
        total = cur.fetchone()[0]

        cur.execute(f"""
            SELECT id, author_name, rating, text, status, helpful_count, created_at
            FROM {schema}.reviews
            {where}
            ORDER BY created_at DESC
            LIMIT {limit} OFFSET {offset}
        """)
        rows = cur.fetchall()

        cur.execute(f"SELECT status, COUNT(*) FROM {schema}.reviews GROUP BY status")
        counts_raw = cur.fetchall()
        counts = {r[0]: r[1] for r in counts_raw}

        cur.close()
        conn.close()

        reviews = []
        for row in rows:
            reviews.append({
                'id': row[0],
                'author_name': row[1],
                'rating': row[2],
                'text': row[3],
                'status': row[4],
                'helpful_count': row[5],
                'created_at': row[6].isoformat() if row[6] else None,
            })

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'reviews': reviews,
                'total': total,
                'page': page,
                'pages': (total + limit - 1) // limit,
                'counts': counts
            }, ensure_ascii=False)
        }

    if method == 'PUT':
        review_id = parts[-1] if parts else None
        body = json.loads(event.get('body') or '{}')
        new_status = body.get('status')

        if not review_id or new_status not in ('approved', 'rejected'):
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Неверные параметры'}, ensure_ascii=False)
            }

        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {schema}.reviews SET status = %s, updated_at = NOW() WHERE id = %s",
            (new_status, review_id)
        )
        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'message': 'Статус обновлён'}, ensure_ascii=False)
        }

    if method == 'DELETE':
        review_id = parts[-1] if parts else None

        if not review_id:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'ID не указан'}, ensure_ascii=False)
            }

        conn = get_connection()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {schema}.reviews WHERE id = %s", (review_id,))
        conn.commit()
        cur.close()
        conn.close()

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({'message': 'Отзыв удалён'}, ensure_ascii=False)
        }

    return {'statusCode': 405, 'headers': cors_headers, 'body': json.dumps({'error': 'Method not allowed'})}
