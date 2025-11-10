"""daylight matching

Revision ID: 003
Revises: 002
Create Date: 2025-10-19 16:25:00

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    
    # Create daylight_matching_sessions table
    op.create_table(
        'daylight_matching_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_name', sa.String(255), nullable=False),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('min_group_size', sa.Integer(), nullable=False, server_default='3', comment='Minimum: 3 people'),
        sa.Column('max_group_size', sa.Integer(), nullable=False, server_default='5', comment='Maximum: 5 people'),
        sa.Column('min_match_threshold', sa.Float(), nullable=False, server_default='70.0', comment='Minimum 70% match'),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending', comment='pending, processing, completed, failed'),
        sa.Column('total_participants', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_tables', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('average_match_score', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_daylight_matching_sessions_id'), 'daylight_matching_sessions', ['id'], unique=False)
    op.create_index(op.f('ix_daylight_matching_sessions_status'), 'daylight_matching_sessions', ['status'], unique=False)
    
    # Create daylight_matching_participants table
    op.create_table(
        'daylight_matching_participants',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('personality_test_id', sa.Integer(), nullable=False),
        sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['session_id'], ['daylight_matching_sessions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['personality_test_id'], ['daylight_personality_tests.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('session_id', 'user_id', name='uq_session_user')
    )
    op.create_index(op.f('ix_daylight_matching_participants_session_id'), 'daylight_matching_participants', ['session_id'], unique=False)
    
    # Create daylight_matching_tables table
    op.create_table(
        'daylight_matching_tables',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=False),
        sa.Column('table_number', sa.Integer(), nullable=False),
        sa.Column('table_size', sa.Integer(), nullable=False),
        sa.Column('average_match_score', sa.Float(), nullable=False),
        sa.Column('members_data', sa.JSON(), nullable=False, comment='Array of user data with personality info'),
        sa.Column('match_matrix', sa.JSON(), nullable=True, comment='Pairwise match scores'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['session_id'], ['daylight_matching_sessions.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_daylight_matching_tables_session_id'), 'daylight_matching_tables', ['session_id'], unique=False)
    
    # Create daylight_matching_scores table
    op.create_table(
        'daylight_matching_scores',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('table_id', sa.Integer(), nullable=False),
        sa.Column('user1_id', sa.Integer(), nullable=False),
        sa.Column('user2_id', sa.Integer(), nullable=False),
        
        # Individual trait differences
        sa.Column('e_diff', sa.Float(), nullable=False),
        sa.Column('o_diff', sa.Float(), nullable=False),
        sa.Column('s_diff', sa.Float(), nullable=False),
        sa.Column('a_diff', sa.Float(), nullable=False),
        
        # Match score components
        sa.Column('trait_similarity', sa.Float(), nullable=False, comment='Cosine similarity of traits'),
        sa.Column('lifestyle_bonus', sa.Float(), nullable=False, comment='L_bonus based on spend tier'),
        sa.Column('comfort_bonus', sa.Float(), nullable=False, comment='C_bonus based on social comfort'),
        sa.Column('serendipity_bonus', sa.Float(), nullable=False, server_default='0.0', comment='Random ±5'),
        
        # Final score
        sa.Column('total_match_score', sa.Float(), nullable=False, comment='0-100 match score'),
        sa.Column('meets_threshold', sa.Boolean(), nullable=False, comment='Score >= 70%'),
        
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['table_id'], ['daylight_matching_tables.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user1_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user2_id'], ['users.id'], ondelete='CASCADE')
    )
    op.create_index(op.f('ix_daylight_matching_scores_table_id'), 'daylight_matching_scores', ['table_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_daylight_matching_scores_table_id'), table_name='daylight_matching_scores')
    op.drop_table('daylight_matching_scores')
    
    op.drop_index(op.f('ix_daylight_matching_tables_session_id'), table_name='daylight_matching_tables')
    op.drop_table('daylight_matching_tables')
    
    op.drop_index(op.f('ix_daylight_matching_participants_session_id'), table_name='daylight_matching_participants')
    op.drop_table('daylight_matching_participants')
    
    op.drop_index(op.f('ix_daylight_matching_sessions_status'), table_name='daylight_matching_sessions')
    op.drop_index(op.f('ix_daylight_matching_sessions_id'), table_name='daylight_matching_sessions')
    op.drop_table('daylight_matching_sessions')