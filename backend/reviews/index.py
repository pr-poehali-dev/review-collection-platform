"""
Управление отзывами: получение одобренных отзывов и создание нового отзыва на модерацию.
"""
import json
import os
import psycopg2
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


def get_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def send_email_notification(author_name: str, rating: int, text: str):
    moderator_email = os.environ.get('MODERATOR_EMAIL', '')
    smtp_host = os.environ.get('SMTP_HOST', '')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    smtp_user = os.environ.get('SMTP_USER', '')
    smtp_pass = os.environ.get('SMTP_PASS', '')

    if not all([moderator_email, smtp_host, smtp_user, smtp_pass]):
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Space Work: новый отзыв от {author_name}'
    msg['From'] = smtp_user
    msg['To'] = moderator_email

    stars = '★' * rating + '☆' * (5 - rating)
    html = f"""
    <html><body style="font-family: sans-serif; background: #f5f5f5; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h2 style="color: #1a1a1a; margin-top: 0;">Новый отзыв на модерацию</h2>
        <p><strong>Автор:</strong> {author_name}</p>
        <p><strong>Рейтинг:</strong> <span style="color: #F59E0B; font-size: 18px;">{stars}</span></p>
        <p><strong>Текст:</strong></p>
        <blockquote style="border-left: 3px solid #22C55E; margin: 0; padding: 12px 16px; background: #f9fafb; border-radius: 0 8px 8px 0; color: #374151;">{text}</blockquote>
        <p style="margin-top: 24px; color: #6B7280; font-size: 14px;">Перейдите в панель модератора, чтобы одобрить или отклонить отзыв.</p>
      </div>
    </body></html>
    """
    msg.attach(MIMEText(html, 'html'))

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.sendmail(smtp_user, moderator_email, msg.as_string())


def handler(event: dict, context) -> dict:
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    method = event.get('httpMethod', 'GET')
    schema = os.environ.get('MAIN_DB_SCHEMA', 'public')

    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        sort = params.get('sort', 'newest')
        page = int(params.get('page', 1))
        limit = int(params.get('limit', 20))
        offset = (page - 1) * limit

        sort_map = {
            'newest': 'created_at DESC',
            'oldest': 'created_at ASC',
            'best': 'rating DESC, created_at DESC',
            'worst': 'rating ASC, created_at DESC',
            'helpful': 'helpful_count DESC, created_at DESC',
        }
        order = sort_map.get(sort, 'created_at DESC')

        conn = get_connection()
        cur = conn.cursor()

        cur.execute(f"SELECT COUNT(*) FROM {schema}.reviews WHERE status = 'approved'")
        total = cur.fetchone()[0]

        cur.execute(f"""
            SELECT id, author_name, rating, text, helpful_count, created_at
            FROM {schema}.reviews
            WHERE status = 'approved'
            ORDER BY {order}
            LIMIT {limit} OFFSET {offset}
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        reviews = []
        for row in rows:
            reviews.append({
                'id': row[0],
                'author_name': row[1],
                'rating': row[2],
                'text': row[3],
                'helpful_count': row[4],
                'created_at': row[5].isoformat() if row[5] else None,
            })

        cur2 = get_connection().cursor()
        conn2 = get_connection()
        cur2 = conn2.cursor()
        cur2.execute(f"SELECT AVG(rating), COUNT(*) FROM {schema}.reviews WHERE status = 'approved'")
        stats_row = cur2.fetchone()
        avg_rating = float(stats_row[0]) if stats_row[0] else 0
        total_approved = stats_row[1]

        rating_dist = {}
        for star in range(1, 6):
            cur2.execute(f"SELECT COUNT(*) FROM {schema}.reviews WHERE status = 'approved' AND rating = {star}")
            rating_dist[str(star)] = cur2.fetchone()[0]

        cur2.close()
        conn2.close()

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'reviews': reviews,
                'total': total,
                'page': page,
                'pages': (total + limit - 1) // limit,
                'stats': {
                    'avg_rating': round(avg_rating, 1),
                    'total': total_approved,
                    'distribution': rating_dist
                }
            }, ensure_ascii=False)
        }

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        author_name = (body.get('author_name') or '').strip()
        text = (body.get('text') or '').strip()
        rating = int(body.get('rating') or 0)

        if not author_name or not text or rating < 1 or rating > 5:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Заполните все поля и выберите рейтинг'}, ensure_ascii=False)
            }

        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {schema}.reviews (author_name, text, rating, status) VALUES (%s, %s, %s, 'pending') RETURNING id",
            (author_name, text, rating)
        )
        review_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        try:
            send_email_notification(author_name, rating, text)
        except Exception:
            pass

        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({'id': review_id, 'message': 'Отзыв отправлен на модерацию'}, ensure_ascii=False)
        }

    return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}
