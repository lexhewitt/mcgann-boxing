
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import { Member, UserRole } from '../../types';
import { useAuth } from '../../context/AuthContext';
import MemberFinancialSummary from './MemberFinancialSummary';
import SetPasswordModal from './SetPasswordModal';
import { getSupabase } from '../../services/supabaseClient';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose }) => {
  const { addMember, members, coaches } = useData();
  const initialFormData = {
    name: '',
    email: '',
    dob: '',
    sex: 'M' as 'M' | 'F',
    ability: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced' | 'Competitive',
    bio: '',
    coachId: null,
    isCarded: false,
    membershipStatus: 'PAYG' as 'PAYG' | 'Monthly' | 'None',
    membershipStartDate: new Date().toISOString().split('T')[0],
    isRollingMonthly: false,
  };
  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.dob) {
        setError("Name, Email, and Date of Birth are required.");
        return;
    }

    const emailExists = members.some(m => m.email.toLowerCase() === formData.email.toLowerCase());
    if (emailExists) {
        setError('A member with this email already exists.');
        return;
    }

    // Also check the database for duplicates (in case database has members not in local state)
    const supabaseClient = getSupabase();
    if (supabaseClient) {
      try {
        const { data: existingMember } = await supabaseClient
          .from('members')
          .select('email')
          .eq('email', formData.email.toLowerCase())
          .maybeSingle();
        
        if (existingMember) {
          setError(`A member with the email "${formData.email}" already exists in the database. Please use a different email address.`);
          return;
        }
      } catch (dbCheckError) {
        console.warn('Could not check database for duplicate email:', dbCheckError);
        // Continue with submission - the database will catch it if it's a duplicate
      }
    }

    try {
      await addMember({
      ...formData,
      role: UserRole.MEMBER,
      coachId: formData.coachId || null,
    });
    
    setFormData(initialFormData); // Reset form
    onClose();
    } catch (error) {
      console.error('Error adding member:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add member. Please try again.';
      setError(errorMessage);
      // Don't close the modal if there's an error, so user can fix it
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-900/20 p-2 rounded">{error}</p>}
        <Input label="Full Name" id="add-name" name="name" type="text" value={formData.name} onChange={handleChange} required />
        <Input label="Email" id="add-email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        <Input label="Date of Birth" id="add-dob" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
        <div>
          <label htmlFor="add-sex" className="block text-sm font-medium text-gray-300 mb-1">Sex</label>
          <select id="add-sex" name="sex" value={formData.sex} onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <div>
          <label htmlFor="add-ability" className="block text-sm font-medium text-gray-300 mb-1">Ability</label>
          <select id="add-ability" name="ability" value={formData.ability} onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
            <option>Competitive</option>
          </select>
        </div>
         <div>
          <label htmlFor="add-coach" className="block text-sm font-medium text-gray-300 mb-1">Assign Coach (Optional)</label>
          <select id="add-coach" name="coachId" value={formData.coachId || ''} onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
              <option value="">None</option>
              {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
            <label htmlFor="add-bio" className="block text-sm font-medium text-gray-300 mb-1">Bio (Optional)</label>
            <textarea id="add-bio" name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-brand-red"></textarea>
        </div>

        <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Create Member</Button>
        </div>
      </form>
    </Modal>
  );
};

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ isOpen, onClose, member }) => {
  const { updateMember, members, coaches } = useData();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState<Member | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Pre-fill form when modal opens or member changes
    if (member) {
      setFormData(member);
    }
  }, [member]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    
    let newFormData = { ...formData, [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value };

    if (name === 'membershipStatus') {
        if (value === 'Monthly' && (!newFormData.membershipExpiry || new Date(newFormData.membershipExpiry) < new Date())) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            newFormData.membershipExpiry = expiryDate.toISOString().split('T')[0];
        } else if (value !== 'Monthly') {
            newFormData.membershipExpiry = undefined;
        }
    }
    
    setFormData(newFormData);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.dob) {
      setError("Name, Email, and Date of Birth are required.");
      return;
    }

    const emailExists = members.some(m => m.email.toLowerCase() === formData.email.toLowerCase() && m.id !== formData.id);
    if (emailExists) {
      setError('A member with this email already exists.');
      return;
    }

    updateMember({
      ...formData,
      coachId: formData.coachId || null,
    });
    onClose();
  };
  
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Member: ${member?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {error && <p className="text-red-500 text-sm bg-red-900/20 p-2 rounded">{error}</p>}
        <Input label="Full Name" id="edit-name" name="name" type="text" value={formData.name} onChange={handleChange} required />
        <Input label="Email" id="edit-email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        <Input label="Date of Birth" id="edit-dob" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
        <div>
          <label htmlFor="edit-sex" className="block text-sm font-medium text-gray-300 mb-1">Sex</label>
          <select id="edit-sex" name="sex" value={formData.sex} onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
            <option value="M">Male</option>
            <option value="F">Female</option>
          </select>
        </div>
        <div>
          <label htmlFor="edit-ability" className="block text-sm font-medium text-gray-300 mb-1">Ability</label>
          <select id="edit-ability" name="ability" value={formData.ability} onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
            <option>Competitive</option>
          </select>
        </div>
        <div>
          <label htmlFor="edit-coach" className="block text-sm font-medium text-gray-300 mb-1">Assign Coach (Optional)</label>
          <select id="edit-coach" name="coachId" value={formData.coachId || ''} onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
            <option value="">None</option>
            {coaches.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="edit-bio" className="block text-sm font-medium text-gray-300 mb-1">Bio (Optional)</label>
          <textarea id="edit-bio" name="bio" value={formData.bio} onChange={handleChange} rows={3} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-500"></textarea>
        </div>

        {isAdmin && (
            <div className="border-t border-gray-700 pt-4 space-y-4">
            <h4 className="text-lg font-semibold text-white">Admin Controls</h4>
            <Input label="Membership Start Date" id="edit-membershipStartDate" name="membershipStartDate" type="date" value={formData.membershipStartDate || ''} onChange={handleChange} />
            <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="edit-isRollingMonthly"
                    name="isRollingMonthly"
                    checked={!!formData.isRollingMonthly}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <label htmlFor="edit-isRollingMonthly" className="text-sm text-gray-300">Is on a rolling monthly contract</label>
            </div>
            <div className="flex items-center gap-2">
                <input 
                    type="checkbox" 
                    id="edit-isCarded"
                    name="isCarded"
                    checked={!!formData.isCarded}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-brand-red focus:ring-brand-red"
                />
                <label htmlFor="edit-isCarded" className="text-sm text-gray-300">Set as Carded Boxer</label>
            </div>
            <div>
                <label htmlFor="edit-membershipStatus" className="block text-sm font-medium text-gray-300 mb-1">Membership Status</label>
                <select id="edit-membershipStatus" name="membershipStatus" value={formData.membershipStatus} onChange={handleChange} className="w-full bg-brand-dark border border-gray-600 rounded-md px-3 py-2 text-white">
                    <option value="None">None</option>
                    <option value="PAYG">Pay As You Go</option>
                    <option value="Monthly">Monthly</option>
                </select>
            </div>
            {formData.membershipStatus === 'Monthly' && (
                 <Input label="Membership Expiry" id="edit-membershipExpiry" name="membershipExpiry" type="date" value={formData.membershipExpiry || ''} onChange={handleChange} />
            )}
            </div>
        )}

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};


const MemberManagement: React.FC = () => {
  const { members, deleteMember, bookings, classes, familyMembers, transactions, refreshData } = useData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberToViewFinancials, setMemberToViewFinancials] = useState<Member | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [memberForPassword, setMemberForPassword] = useState<Member | null>(null);

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const unpaidBookings = useMemo(() => bookings.filter(b => !b.paid), [bookings]);

  const membersWithOwed = useMemo(() => {
    return filteredMembers.map(member => {
        const owedAmount = unpaidBookings
            .filter(b => b.memberId === member.id)
            .reduce((acc, booking) => {
                const classPrice = classes.find(c => c.id === booking.classId)?.price || 0;
                return acc + classPrice;
            }, 0);
        return { ...member, owedAmount };
    });
  }, [filteredMembers, unpaidBookings, classes]);


  const handleEditClick = (member: Member) => {
    setMemberToEdit(member);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setMemberToEdit(null);
  };

  const getMembershipDisplay = (member: Member) => {
      if (member.membershipStatus === 'Monthly') {
        const expiry = member.membershipExpiry ? new Date(member.membershipExpiry) : null;
        if (expiry && expiry >= new Date()) {
            return <span className="text-green-400">Monthly</span>
        }
        return <span className="text-yellow-400">Expired</span>
      }
      return <span className="text-gray-400">{member.membershipStatus}</span>;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Members ({filteredMembers.length})</h3>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={async () => {
                setIsRefreshing(true);
                await refreshData();
                setIsRefreshing(false);
              }}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh from Database'}
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>Add New Member</Button>
          </div>
        </div>
        <div className="mb-4">
          <Input 
            label="Search Members"
            id="member-search"
            type="text"
            placeholder="Filter by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table className="min-w-full bg-brand-dark text-sm whitespace-nowrap">
          <thead className="bg-black">
            <tr>
              <th className="py-2 px-4 text-left">Name</th>
              <th className="py-2 px-4 text-left">Membership</th>
              <th className="py-2 px-4 text-left">Start Date</th>
              <th className="py-2 px-4 text-left">Expiry</th>
              <th className="py-2 px-4 text-left">Rolling?</th>
              <th className="py-2 px-4 text-left">Owed (£)</th>
              <th className="py-2 px-4 text-left">Financials</th>
              <th className="py-2 px-4 text-left">Email</th>
              <th className="py-2 px-4 text-left">Password</th>
              <th className="py-2 px-4 text-left">Edit</th>
              <th className="py-2 px-4 text-left">Delete</th>
            </tr>
          </thead>
          <tbody>
            {membersWithOwed.length > 0 ? (
              membersWithOwed.map(member => (
                <tr key={member.id} className="border-b border-gray-800 hover:bg-gray-800">
                  <td className="py-2 px-4">
                    <div className="font-semibold">{member.name}</div>
                    <div className="text-xs text-gray-400">{member.email}</div>
                  </td>
                  <td className="py-2 px-4">{getMembershipDisplay(member)}</td>
                  <td className="py-2 px-4">{member.membershipStartDate ? new Date(member.membershipStartDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-2 px-4">{member.membershipExpiry ? new Date(member.membershipExpiry).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-2 px-4">{member.isRollingMonthly ? 'Yes' : 'No'}</td>
                   <td className={`py-2 px-4 font-bold ${member.owedAmount > 0 ? 'text-brand-red' : 'text-green-400'}`}>{member.owedAmount.toFixed(2)}</td>
                  <td className="py-2 px-4">
                    <Button 
                      variant="secondary" 
                      className="text-xs py-1 px-2 w-full" 
                      onClick={() => setMemberToViewFinancials(member)}
                    >
                      View
                    </Button>
                  </td>
                  <td className="py-2 px-4">
                    <a href={`mailto:${member.email}`}>
                      <Button variant="secondary" className="text-xs py-1 px-2 w-full">Email</Button>
                    </a>
                  </td>
                  <td className="py-2 px-4">
                    <Button 
                      variant="secondary" 
                      className="text-xs py-1 px-2 w-full" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setMemberForPassword(member);
                        setIsPasswordModalOpen(true);
                      }}
                      title="Set or reset password"
                    >
                      Set Password
                    </Button>
                  </td>
                  <td className="py-2 px-4">
                    <Button variant="secondary" className="text-xs py-1 px-2 w-full" onClick={() => handleEditClick(member)}>Edit</Button>
                  </td>
                  <td className="py-2 px-4">
                    <Button variant="danger" className="text-xs py-1 px-2 w-full" onClick={() => window.confirm('Are you sure?') && deleteMember(member.id)}>Delete</Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-400">
                  No members found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AddMemberModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditMemberModal isOpen={isEditModalOpen} onClose={handleCloseEditModal} member={memberToEdit} />
      {memberForPassword && (
        <SetPasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => {
            setIsPasswordModalOpen(false);
            setMemberForPassword(null);
          }}
          userName={memberForPassword.name}
          userEmail={memberForPassword.email}
          userId={memberForPassword.id}
          onSuccess={() => {
            // Optionally refresh data or show success message
          }}
        />
      )}
      {memberToViewFinancials && (
        <Modal
          isOpen={!!memberToViewFinancials}
          onClose={() => setMemberToViewFinancials(null)}
          title={`Financial Statement - ${memberToViewFinancials.name}`}
        >
          <MemberFinancialSummary
            member={memberToViewFinancials}
            transactions={transactions}
            onClose={() => setMemberToViewFinancials(null)}
            embedded={true}
          />
        </Modal>
      )}
    </>
  );
};

export default MemberManagement;
