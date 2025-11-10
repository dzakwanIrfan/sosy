"""daylight personality test

Revision ID: 002
Revises: 001
Create Date: 2025-10-19 16:20:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # Create daylight_personality_tests table
    op.create_table(
        'daylight_personality_tests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('test_date', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        
        # Raw trait scores (-10 to +10)
        sa.Column('e_raw', sa.Float(), nullable=False, comment='Energy: Extrovert(+) to Introvert(-)'),
        sa.Column('o_raw', sa.Float(), nullable=False, comment='Openness: Abstract(+) to Practical(-)'),
        sa.Column('s_raw', sa.Float(), nullable=False, comment='Structure: Flexible(+) to Structured(-)'),
        sa.Column('a_raw', sa.Float(), nullable=False, comment='Affect: Feeling(+) to Thinking(-)'),
        sa.Column('c_raw', sa.Float(), nullable=False, comment='Comfort with strangers'),
        sa.Column('l_raw', sa.Integer(), nullable=False, comment='Lifestyle tier: 1,2,3'),
        
        # Normalized scores (0-100)
        sa.Column('e_normalized', sa.Float(), nullable=False),
        sa.Column('o_normalized', sa.Float(), nullable=False),
        sa.Column('s_normalized', sa.Float(), nullable=False),
        sa.Column('a_normalized', sa.Float(), nullable=False),
        sa.Column('c_normalized', sa.Float(), nullable=False),
        sa.Column('l_normalized', sa.Float(), nullable=False),
        
        # Profile score and archetype
        sa.Column('profile_score', sa.Float(), nullable=False, comment='Weighted score 0-100'),
        sa.Column('archetype', sa.String(50), nullable=False, comment='Day archetype'),
        sa.Column('archetype_symbol', sa.String(10), nullable=False),
        
        # Context data from questionnaire
        sa.Column('relationship_status', sa.String(50), nullable=True),
        sa.Column('looking_for', sa.String(100), nullable=True),
        sa.Column('gender_comfort', sa.String(50), nullable=True),
        
        # Answers stored as JSON
        sa.Column('answers', sa.JSON(), nullable=False, comment='All Q&A responses'),
        
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_daylight_personality_tests_user_id'), 'daylight_personality_tests', ['user_id'], unique=False)
    op.create_index(op.f('ix_daylight_personality_tests_archetype'), 'daylight_personality_tests', ['archetype'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_daylight_personality_tests_archetype'), table_name='daylight_personality_tests')
    op.drop_index(op.f('ix_daylight_personality_tests_user_id'), table_name='daylight_personality_tests')
    op.drop_table('daylight_personality_tests')