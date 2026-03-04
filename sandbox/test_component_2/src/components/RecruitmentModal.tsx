import React, { useState } from 'react';
import { RecruitmentState, StaffCandidate, RECRUITMENT_CONFIG } from '../types/recruitment';

const formatMoney = (amount: number): string => {
  return `$${amount.toLocaleString()}`;
};

interface RecruitmentModalProps {
  recruitmentState: RecruitmentState;
  onHireCandidate: (candidate: StaffCandidate) => void;
  onRerollCandidates: (premium: boolean) => void;
  onSkipRecruitment: () => void;
  onClose: () => void;
  playerMoney: number;
}

const RecruitmentModal: React.FC<RecruitmentModalProps> = ({
  recruitmentState,
  onHireCandidate,
  onRerollCandidates,
  onSkipRecruitment,
  onClose,
  playerMoney,
}) => {
  const [selectedCandidate, setSelectedCandidate] = useState<StaffCandidate | null>(null);
  
  const canUseFreeReroll = recruitmentState.freeRerollsUsed < RECRUITMENT_CONFIG.freeRerollsPerPosition;
  const canAffordPremiumReroll = playerMoney >= RECRUITMENT_CONFIG.premiumRerollCost;

  const handleSelectCandidate = (candidate: StaffCandidate) => {
    setSelectedCandidate(candidate);
  };

  const handleHire = () => {
    if (selectedCandidate) {
      onHireCandidate(selectedCandidate);
      setSelectedCandidate(null);
    }
  };

  const handleReroll = (premium: boolean) => {
    onRerollCandidates(premium);
    setSelectedCandidate(null);
  };

  const handleSkip = () => {
    onSkipRecruitment();
    setSelectedCandidate(null);
  };

  const handleClose = () => {
    onClose();
    setSelectedCandidate(null);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '2px solid #333',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        color: '#fff',
        minWidth: '300px',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #333',
          paddingBottom: '15px',
        }}>
          <div>
            <h3 style={{ margin: 0, color: '#4CAF50' }}>🏖️ Recruitment</h3>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#ccc' }}>
              Position: {recruitmentState.currentOccupation} ({recruitmentState.currentPosition + 1}/{recruitmentState.totalPositions} required)
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            ×
          </button>
        </div>

        {/* Poker-style Candidate Cards */}
        <div style={{
          position: 'relative',
          height: '280px',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          perspective: '1000px',
        }}>
          {recruitmentState.candidates.map((candidate, index) => {
            const isSelected = selectedCandidate?.id === candidate.id;
            const cardPosition = (index - 1) * 30; // Fixed positions: -30, 0, +30
            
            return (
              <div
                key={candidate.id}
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  left: `${50 + cardPosition}%`,
                  transform: `translateX(-50%) rotate(${(index - 1) * 8}deg) ${isSelected ? 'scale(1.1)' : 'scale(1)'}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  zIndex: isSelected ? 10 : 5 - Math.abs(index - 1),
                }}
                onClick={() => handleSelectCandidate(candidate)}
              >
                <CandidateCard
                  candidate={candidate}
                  isSelected={isSelected}
                  onSelect={() => handleSelectCandidate(candidate)}
                />
              </div>
            );
          })}
        </div>

        {/* Hire and Pass Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          marginBottom: '20px',
        }}>
          <button
            onClick={handleHire}
            disabled={!selectedCandidate}
            style={{
              padding: '12px 30px',
              border: '2px solid #4CAF50',
              borderRadius: '8px',
              backgroundColor: selectedCandidate ? '#4CAF50' : '#333',
              color: selectedCandidate ? '#fff' : '#666',
              cursor: selectedCandidate ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s',
            }}
          >
            HIRE SELECTED
          </button>

          <button
            onClick={handleSkip}
            style={{
              padding: '12px 30px',
              border: '2px solid #9E9E9E',
              borderRadius: '8px',
              backgroundColor: '#9E9E9E',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s',
            }}
          >
            PASS
          </button>
        </div>

        {/* Reroll Options */}
        <div style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          borderTop: '1px solid #333',
          paddingTop: '15px',
        }}>
          <button
            onClick={() => handleReroll(false)}
            disabled={!canUseFreeReroll}
            style={{
              padding: '10px 15px',
              border: '1px solid #4CAF50',
              borderRadius: '6px',
              backgroundColor: canUseFreeReroll ? '#4CAF50' : '#333',
              color: canUseFreeReroll ? '#fff' : '#666',
              cursor: canUseFreeReroll ? 'pointer' : 'not-allowed',
              fontSize: '14px',
            }}
          >
            🔄 Free Reroll ({RECRUITMENT_CONFIG.freeRerollsPerPosition - recruitmentState.freeRerollsUsed} left)
          </button>

          <button
            onClick={() => handleReroll(true)}
            disabled={!canAffordPremiumReroll}
            style={{
              padding: '10px 15px',
              border: '1px solid #FF9800',
              borderRadius: '6px',
              backgroundColor: canAffordPremiumReroll ? '#FF9800' : '#333',
              color: canAffordPremiumReroll ? '#fff' : '#666',
              cursor: canAffordPremiumReroll ? 'pointer' : 'not-allowed',
              fontSize: '14px',
            }}
          >
            💰 Premium Reroll ({formatMoney(RECRUITMENT_CONFIG.premiumRerollCost)})
          </button>

          <button
            onClick={handleSkip}
            style={{
              padding: '10px 15px',
              border: '1px solid #9E9E9E',
              borderRadius: '6px',
              backgroundColor: '#9E9E9E',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            ⏭️ Skip Later
          </button>
        </div>

        {/* Info Text */}
        <div style={{
          marginTop: '15px',
          fontSize: '12px',
          color: '#888',
          textAlign: 'center',
        }}>
          <p style={{ margin: '5px 0' }}>
            Free rerolls: {RECRUITMENT_CONFIG.freeRerollsPerPosition - recruitmentState.freeRerollsUsed} remaining for this position
          </p>
          <p style={{ margin: '5px 0' }}>
            Premium rerolls have higher quality candidates
          </p>
          <p style={{ margin: '5px 0' }}>
            Skip hires temporary staff with 3.0 rating
          </p>
        </div>
      </div>
    </div>
  );
};

interface CandidateCardProps {
  candidate: StaffCandidate;
  isSelected: boolean;
  onSelect: () => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, isSelected, onSelect }) => {
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div style={{ fontSize: '12px', color: '#FFD700' }}>
        {'★'.repeat(fullStars)}
        {hasHalfStar && '☆'}
        {'☆'.repeat(emptyStars)}
      </div>
    );
  };

  return (
    <div
      style={{
        width: '160px',
        height: '240px',
        border: isSelected ? '3px solid #4CAF50' : '1px solid #444',
        borderRadius: '12px',
        padding: '12px',
        backgroundColor: isSelected ? '#2a3a2a' : '#2a2a2a',
        textAlign: 'center',
        transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s',
        cursor: 'pointer',
        boxShadow: isSelected ? '0 8px 24px rgba(76, 175, 80, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
      }}
      onClick={onSelect}
    >
      {/* Avatar */}
      <div style={{
        width: '60px',
        height: '60px',
        backgroundColor: '#444',
        borderRadius: '50%',
        margin: '0 auto 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        border: isSelected ? '2px solid #4CAF50' : 'none',
      }}>
        👤
      </div>

      {/* Name */}
      <div style={{
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '4px',
        color: '#fff',
      }}>
        {candidate.name}
      </div>

      {/* Occupation */}
      <div style={{
        fontSize: '12px',
        color: '#888',
        marginBottom: '8px',
      }}>
        {candidate.occupation}
      </div>

      {/* Rating */}
      <div style={{ marginBottom: '8px' }}>
        {renderStars(candidate.rating)}
      </div>

      {/* Experience */}
      <div style={{
        fontSize: '11px',
        color: '#ccc',
        marginBottom: '4px',
      }}>
        📅 {candidate.experience} years exp
      </div>

      {/* Salary */}
      <div style={{
        fontSize: '12px',
        color: '#4CAF50',
        fontWeight: 'bold',
        marginBottom: '8px',
      }}>
        💰 {formatMoney(candidate.dailyCost)}/day
      </div>

      {/* Traits */}
      {candidate.traits.length > 0 && (
        <div style={{
          fontSize: '10px',
          color: '#888',
          marginBottom: '8px',
        }}>
          {candidate.traits.slice(0, 2).map((trait, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>
              • {trait}
            </div>
          ))}
        </div>
      )}

      {/* Selection Indicator */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '24px',
          height: '24px',
          backgroundColor: '#4CAF50',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 'bold',
        }}>
          ✓
        </div>
      )}
    </div>
  );
};

export default RecruitmentModal;
