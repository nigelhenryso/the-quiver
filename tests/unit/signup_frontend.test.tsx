import { screen, render , waitFor } from '@testing-library/react';
import SignUpModal from '@/src/components/ui/authModals/SignUpModal';
import { userEvent } from '@testing-library/user-event';

jest.mock('@/services/authService', () => ({
  signUpWithPassword: jest.fn().mockResolvedValue({ ok: true }),
}))

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true }),
  }) as jest.Mock
})

afterEach(() => {
  jest.clearAllMocks()
})



describe('All fields are empty', () => {
    it('Should display  all relevant error messages', async () => {
        render(<SignUpModal isOpen={true} onClose={() => {}}/>);
        const user = userEvent.setup()
        const signUpButton = screen.getByRole('button', { name: "Sign Up"});
        await userEvent.click(signUpButton);

         expect(screen.getByText('Email is required.')).toBeInTheDocument();
         expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
         expect(screen.getByText('Please confirm your password.')).toBeInTheDocument();

    })
});


describe('Email field is empty', () => {
    it('Should display error message: \'Email is required.\'', async () => {
        render(<SignUpModal isOpen={true} onClose={() => {}}/>)
        
        const user = userEvent.setup()
        const passwordInputField = screen.getByPlaceholderText('Create a strong password');
        const confirmPasswordField = screen.getByPlaceholderText('Retype Password');
        const signUpButton = screen.getByRole('button', { name: "Sign Up"});

        await user.type(passwordInputField, 'abc123pass');
        await user.type(confirmPasswordField, 'abc123pass');
        await user.click(signUpButton);

        expect(screen.getByText('Email is required.')).toBeInTheDocument();
        

    });
})

describe('Invalid email entered', () => {
    it('Should display error message: \'Enter a valid email address.\'', async () => {
        render(<SignUpModal isOpen={true} onClose={() => {}}/>)
        
        const user = userEvent.setup()
        
        const emailInputField = screen.getByPlaceholderText('e.g. juan_dela_cruz@dlsu.edu.ph')
        const passwordInputField = screen.getByPlaceholderText('Create a strong password');
        const confirmPasswordField = screen.getByPlaceholderText('Retype Password');
        const signUpButton = screen.getByRole('button', { name: "Sign Up"});

        await user.type(emailInputField, 'this is not a valid email')
        await user.type(passwordInputField, 'abc123pass');
        await user.type(confirmPasswordField, 'abc123pass');
        await user.click(signUpButton)

        expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()

    });
})

describe('Valid email but invalid DLSU email entered', () => {
    it('Should display error message: \'Use your DLSU Email.\'', async () => {
        render(<SignUpModal isOpen={true} onClose={() => {}}/>)
        
        const user = userEvent.setup()
        
        const emailInputField = screen.getByPlaceholderText('e.g. juan_dela_cruz@dlsu.edu.ph')
        const passwordInputField = screen.getByPlaceholderText('Create a strong password');
        const confirmPasswordField = screen.getByPlaceholderText('Retype Password');
        const signUpButton = screen.getByRole('button', { name: "Sign Up"});

        await user.type(emailInputField, 'juan_dela_cruz@gmail.com')
        await user.type(passwordInputField, 'abc123pass');
        await user.type(confirmPasswordField, 'abc123pass');
        await user.click(signUpButton)

        expect(screen.getByText('Use your DLSU Email.')).toBeInTheDocument()

    });
})

describe('Password field is empty', () => {
    it('Should display error message: \'Password must be at least 8 characters.\'', async () => {
        render(<SignUpModal isOpen={true} onClose={() => {}}/>)
        
        const user = userEvent.setup()
        
        const emailInputField = screen.getByPlaceholderText('e.g. juan_dela_cruz@dlsu.edu.ph')
        const confirmPasswordField = screen.getByPlaceholderText('Retype Password');
        const signUpButton = screen.getByRole('button', { name: "Sign Up"});

        await user.type(emailInputField, 'juan_dela_cruz@dlsu.edu.ph');
        await user.type(confirmPasswordField, 'abc123pass');
        await user.click(signUpButton);

        
        expect(screen.getByText('Password must be at least 8 characters.'))
    });
});

describe('Password entered is less than 8 characters', () => {
    it('Should display error message: \'Password must be at least 8 characters.\'', async () => {
        render(<SignUpModal isOpen={true} onClose={() => {}}/>)
        
        const user = userEvent.setup()
        
        const emailInputField = screen.getByPlaceholderText('e.g. juan_dela_cruz@dlsu.edu.ph');
        const passwordInputField = screen.getByPlaceholderText('Create a strong password');
        const confirmPasswordField = screen.getByPlaceholderText('Retype Password');
        const signUpButton = screen.getByRole('button', { name: "Sign Up"});

        await user.type(emailInputField, 'juan_dela_cruz@dlsu.edu.ph');
        await user.type(passwordInputField, 'abc123')
        await user.type(confirmPasswordField, 'abc123');
        await user.click(signUpButton);

        
        expect(screen.getByText('Password must be at least 8 characters.'))
    });
});

describe('Password entered consists of only spaces', () => {
    it('Should display error message: \'Password must be at least 8 characters.\'', async () => {
        render(<SignUpModal isOpen={true} onClose={() => {}}/>)
        
        const user = userEvent.setup()
        
        const emailInputField = screen.getByPlaceholderText('e.g. juan_dela_cruz@dlsu.edu.ph');
        const passwordInputField = screen.getByPlaceholderText('Create a strong password');
        const confirmPasswordField = screen.getByPlaceholderText('Retype Password');
        const signUpButton = screen.getByRole('button', { name: "Sign Up"});

        await user.type(emailInputField, 'juan_dela_cruz@dlsu.edu.ph');
        await user.type(passwordInputField, '      ')
        await user.type(confirmPasswordField, '      ');
        await user.click(signUpButton);

        
        expect(screen.getByText('Password must be at least 8 characters.'))
    });
});

describe('Confirm password is empty', () => {
    it('Should display error message: \'Please confirm your password.\'', async () => {
        render(<SignUpModal isOpen={true} onClose={() => {}}/>)
        
        const user = userEvent.setup()
        
        const emailInputField = screen.getByPlaceholderText('e.g. juan_dela_cruz@dlsu.edu.ph');
        const passwordInputField = screen.getByPlaceholderText('Create a strong password');
        const confirmPasswordField = screen.getByPlaceholderText('Retype Password');
        const signUpButton = screen.getByRole('button', { name: "Sign Up"});

        await user.type(emailInputField, 'juan_dela_cruz@dlsu.edu.ph');
        await user.type(passwordInputField, 'abc123pass')
        await user.click(signUpButton);

        
        expect(screen.getByText('Please confirm your password.')).toBeInTheDocument()
    });
});


describe('Confirm password does not match with password entered', () => {
    it('Should display error message: \'Passwords do not match.\'', async () => {
        render(<SignUpModal isOpen={true} onClose={() => {}}/>)
        
        const user = userEvent.setup()
        
        const emailInputField = screen.getByPlaceholderText('e.g. juan_dela_cruz@dlsu.edu.ph');
        const passwordInputField = screen.getByPlaceholderText('Create a strong password');
        const confirmPasswordField = screen.getByPlaceholderText('Retype Password');
        const signUpButton = screen.getByRole('button', { name: "Sign Up"});

        await user.type(emailInputField, 'juan_dela_cruz@dlsu.edu.ph');
        await user.type(passwordInputField, 'abc123pass')
        await user.type(confirmPasswordField, 'ABC123PASS');
        await user.click(signUpButton);

        
        expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    });
});

describe('Confirm password consits of only spaces', () => {
    it('Should display error message: \'Please confirm your password.\'', async () => {
        render(<SignUpModal isOpen={true} onClose={() => {}}/>)
        
        const user = userEvent.setup()
        
        const emailInputField = screen.getByPlaceholderText('e.g. juan_dela_cruz@dlsu.edu.ph');
        const passwordInputField = screen.getByPlaceholderText('Create a strong password');
        const confirmPasswordField = screen.getByPlaceholderText('Retype Password');
        const signUpButton = screen.getByRole('button', { name: "Sign Up"});

        await user.type(emailInputField, 'juan_dela_cruz@dlsu.edu.ph');
        await user.type(passwordInputField, 'abc123pass')
        await user.type(confirmPasswordField, '     ');
        await user.click(signUpButton);

        
        expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
    });
});



describe('Password and confirm fields are empty', () => {
    it('Should display  all relevant error messages', async () => {
        render(<SignUpModal isOpen={true} onClose={() => {}}/>);
        const user = userEvent.setup();
        const emailInputField = screen.getByPlaceholderText('e.g. juan_dela_cruz@dlsu.edu.ph');
        const signUpButton = screen.getByRole('button', { name: "Sign Up"});


        await user.type(emailInputField, 'juan_dela_cruz@dlsu.edu.ph')
        await userEvent.click(signUpButton);

         expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
         expect(screen.getByText('Please confirm your password.')).toBeInTheDocument();

    })
})


describe('All inputs are complete and valid', () => {
    it('Shoud not display any error messages', async () => {
        render(<SignUpModal isOpen={true} onClose={() => {}}/>)
        
        const user = userEvent.setup()
        
        const emailInputField = screen.getByPlaceholderText('e.g. juan_dela_cruz@dlsu.edu.ph');
        const passwordInputField = screen.getByPlaceholderText('Create a strong password');
        const confirmPasswordField = screen.getByPlaceholderText('Retype Password');
        const signUpButton = screen.getByRole('button', { name: "Sign Up"});

        await user.type(emailInputField, 'juan_dela_cruz@dlsu.edu.ph');
        await user.type(passwordInputField, 'abc123pass')
        await user.type(confirmPasswordField, 'abc123pass');
        await user.click(signUpButton);

        const alertElems = screen.queryAllByRole('alert')
    
        alertElems.forEach((elem) => {
            expect(elem.textContent?.trim()).toBe('')
        });

    });
});






